#!/usr/bin/env python3
"""
Export datannur catalog to DCAT-AP-CH oriented interoperability artifacts.
"""

from collections import Counter, defaultdict
from decimal import Decimal
from html import escape
import json
import re
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote

from _local_runtime import SCHEMAS_DIR, require_data_db_dir

try:
    from rdflib import Graph, Namespace, Literal, URIRef, BNode
    from rdflib.namespace import RDF, RDFS, DCTERMS, FOAF, XSD, SKOS
except ImportError as e:
    missing = str(e).split("'")[1] if "'" in str(e) else "rdflib"
    print(f"❌ Missing dependency: {missing}")
    print("   Install with: pip install rdflib")
    sys.exit(1)

try:
    from pyshacl import validate as validate_shacl
except ImportError:
    validate_shacl = None
    print("⚠️  pyshacl not available, SHACL validation will be skipped")
    print("   Install with: pip install pyshacl")

DCAT = Namespace("http://www.w3.org/ns/dcat#")
VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
SCHEMA = Namespace("http://schema.org/")

FILE_TYPE_URIS = {
    "csv": "http://publications.europa.eu/resource/authority/file-type/CSV",
    "xlsx": "http://publications.europa.eu/resource/authority/file-type/XLSX",
    "xml": "http://publications.europa.eu/resource/authority/file-type/XML",
    "json": "http://publications.europa.eu/resource/authority/file-type/JSON",
    "parquet": "http://publications.europa.eu/resource/authority/file-type/PARQUET",
    "pdf": "http://publications.europa.eu/resource/authority/file-type/PDF",
    "sas": "http://publications.europa.eu/resource/authority/file-type/SAS",
}

MEDIA_TYPES = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xml": "application/xml",
    "json": "application/json",
    "parquet": "application/vnd.apache.parquet",
    "pdf": "application/pdf",
    "sas": "application/x-sas-data",
}

LICENSE_URIS = {
    "cc-by-4.0": "https://creativecommons.org/licenses/by/4.0/",
    "cc by 4.0": "https://creativecommons.org/licenses/by/4.0/",
}


class DCATExporter:
    """Export datannur catalog to DCAT-AP-CH format"""

    def __init__(self, data_dir: Path, config: Dict):
        self.data_dir = data_dir
        self.config = config
        self.graph = Graph()

        self._bind_namespaces()

        self.datasets = []
        self.organizations = {}
        self.folders = {}
        self.tags = {}
        self.docs = {}
        self.validation_results = []
        self.distributions = []
        self.dcat_dataset_count = 0

    def _bind_namespaces(self):
        """Bind RDF namespaces"""
        self.graph.bind("dcat", DCAT)
        self.graph.bind("dct", DCTERMS)
        self.graph.bind("foaf", FOAF)
        self.graph.bind("xsd", XSD)
        self.graph.bind("rdfs", RDFS)
        self.graph.bind("vcard", VCARD)
        self.graph.bind("schema", SCHEMA)
        self.graph.bind("skos", SKOS)

    def load_data(self):
        """Load JSON data from database files"""
        db_dir = require_data_db_dir(self.data_dir.parent)

        with open(db_dir / "dataset.json", "r", encoding="utf-8") as f:
            self.datasets = json.load(f)

        with open(db_dir / "organization.json", "r", encoding="utf-8") as f:
            organizations = json.load(f)
            self.organizations = {inst["id"]: inst for inst in organizations}

        with open(db_dir / "folder.json", "r", encoding="utf-8") as f:
            folders = json.load(f)
            self.folders = {folder["id"]: folder for folder in folders}

        with open(db_dir / "tag.json", "r", encoding="utf-8") as f:
            tags = json.load(f)
            self.tags = {tag["id"]: tag for tag in tags}

        with open(db_dir / "doc.json", "r", encoding="utf-8") as f:
            docs = json.load(f)
            self.docs = {doc["id"]: doc for doc in docs}

    def create_catalog(self):
        """Create the main DCAT Catalog"""
        catalog_uri = URIRef(self.config["catalog_uri"])

        self.graph.add((catalog_uri, RDF.type, DCAT.Catalog))

        # Mandatory: title
        catalog_title = self.config.get("catalog_title", "Data Catalog")
        self.graph.add(
            (catalog_uri, DCTERMS.title, self._get_language_literal(catalog_title))
        )

        # Mandatory: description
        catalog_desc = self.config.get(
            "catalog_description", "DCAT-AP-CH compliant data catalog"
        )
        self.graph.add(
            (catalog_uri, DCTERMS.description, self._get_language_literal(catalog_desc))
        )

        # Mandatory: publisher
        catalog_publisher = self.config.get("catalog_publisher", "")
        if catalog_publisher:
            publisher_uri = URIRef(
                f"{self.config.get('base_uri', 'https://example.org/')}publisher/catalog"
            )
            self.graph.add((catalog_uri, DCTERMS.publisher, publisher_uri))
            self.graph.add((publisher_uri, RDF.type, FOAF.Agent))
            self.graph.add(
                (
                    publisher_uri,
                    FOAF.name,
                    self._get_language_literal(catalog_publisher),
                )
            )

        for dataset_id in self._get_dcat_dataset_ids():
            dataset_uri = self._get_dataset_uri(dataset_id)
            self.graph.add((catalog_uri, DCAT.dataset, dataset_uri))

    def _get_publication_folder_types(self) -> set[str]:
        folder_types = self.config.get("dcat_publication_folder_types", ["package"])
        return {str(folder_type).strip().lower() for folder_type in folder_types}

    def _get_publication_folder(self, dataset: Dict) -> Optional[Dict]:
        folder_id = dataset.get("folder_id")
        folder = self.folders.get(folder_id) if folder_id else None
        folder_type = str(folder.get("type", "")).strip().lower() if folder else ""
        if folder_type in self._get_publication_folder_types():
            return folder
        return None

    def _get_datasets_by_publication_folder(self) -> Dict[str, List[Dict]]:
        datasets_by_folder = defaultdict(list)
        for dataset in self.datasets:
            folder = self._get_publication_folder(dataset)
            if folder:
                datasets_by_folder[folder["id"]].append(dataset)
        return datasets_by_folder

    def _get_dcat_dataset_ids(self) -> List[str]:
        dataset_ids = []
        seen = set()
        for dataset in self.datasets:
            folder = self._get_publication_folder(dataset)
            dataset_id = folder["id"] if folder else dataset["id"]
            if dataset_id not in seen:
                seen.add(dataset_id)
                dataset_ids.append(dataset_id)
        return dataset_ids

    def _get_dataset_uri(self, dataset_id: str) -> URIRef:
        """Generate URI for a dataset"""
        base_uri = self.config.get("base_uri", "https://example.org/")
        return URIRef(f"{base_uri}dataset/{dataset_id}")

    def _get_distribution_uri(self, dataset_id: str, dist_id: str = "1") -> URIRef:
        """Generate URI for a distribution"""
        base_uri = self.config.get("base_uri", "https://example.org/")
        return URIRef(f"{base_uri}dataset/{dataset_id}/distribution/{dist_id}")

    def _get_theme_uri(self, tag_id: str) -> URIRef:
        base_uri = self.config.get("base_uri", "https://example.org/")
        return URIRef(f"{base_uri}theme/{tag_id}")

    def _parse_date(self, date_value, field: str = "") -> Optional[Literal]:
        """Parse date from various formats to appropriate xsd datatype"""
        if not date_value:
            return None

        date_str = str(date_value).strip()

        if field == "last_update_date" and self._is_unix_timestamp(date_str):
            normalized = datetime.fromtimestamp(int(date_str), timezone.utc).replace(
                tzinfo=None
            )
            return Literal(normalized.isoformat(), datatype=XSD.dateTime)

        # Handle ISO datetime values, including slash-separated dates.
        if "T" in date_str:
            return self._date_time_literal(date_str.replace("/", "-", 2))

        # Handle YYYY/MM/DD
        if "/" in date_str and len(date_str) >= 10:
            parts = date_str.split("/")
            if len(parts) == 3:
                iso_date = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                return self._date_literal(iso_date)

        # Handle Year/Month format (YYYY/MM)
        if "/" in date_str:
            parts = date_str.split("/")
            if len(parts) == 2:
                iso_date = f"{parts[0]}-{parts[1].zfill(2)}"
                return self._year_month_literal(iso_date)

        # Handle YYYY-MM format (already ISO format for gYearMonth)
        if "-" in date_str and len(date_str) == 7:
            return self._year_month_literal(date_str)

        # Handle YYYY-MM-DD format
        if "-" in date_str and len(date_str) == 10:
            return self._date_literal(date_str)

        # Year only
        if date_str.isdigit() and len(date_str) == 4:
            return Literal(date_str, datatype=XSD.gYear)

        return None

    def _parse_temporal_date(self, date_value, bound: str) -> Optional[Literal]:
        quarter_date = self._parse_quarter_date(date_value, bound)
        if quarter_date:
            return quarter_date
        return self._parse_date(date_value)

    def _parse_quarter_date(self, date_value, bound: str) -> Optional[Literal]:
        if not date_value:
            return None

        match = re.fullmatch(r"(\d{4})\s*[QqTt]([1-4])", str(date_value).strip())
        if not match:
            return None

        year = int(match.group(1))
        quarter = int(match.group(2))
        month = (quarter - 1) * 3 + (1 if bound == "start" else 3)
        day = 1 if bound == "start" else [31, 30, 30, 31][quarter - 1]
        return Literal(f"{year:04d}-{month:02d}-{day:02d}", datatype=XSD.date)

    def _is_unix_timestamp(self, date_str: str) -> bool:
        if not re.fullmatch(r"\d{10}", date_str):
            return False
        timestamp = int(date_str)
        return 946684800 <= timestamp <= 4102444800

    def _date_literal(self, date_str: str) -> Optional[Literal]:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None
        return Literal(date_str, datatype=XSD.date)

    def _year_month_literal(self, date_str: str) -> Optional[Literal]:
        try:
            datetime.strptime(date_str, "%Y-%m")
        except ValueError:
            return None
        return Literal(date_str, datatype=XSD.gYearMonth)

    def _date_time_literal(self, date_str: str) -> Optional[Literal]:
        try:
            datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            return None
        return Literal(date_str, datatype=XSD.dateTime)

    def _is_parseable_date(self, date_value, field: str = "") -> bool:
        return not date_value or self._parse_date(date_value, field) is not None

    def _is_parseable_temporal_date(self, date_value, bound: str) -> bool:
        return (
            not date_value or self._parse_temporal_date(date_value, bound) is not None
        )

    def _get_language_literal(self, text: str, lang: str = "fr") -> Literal:
        """Create a language-tagged literal"""
        return Literal(text, lang=lang)

    def _license_value(self, license_value: str):
        normalized_license = license_value.strip()
        license_key = normalized_license.lower().split(" - ")[0]
        if license_key in LICENSE_URIS:
            return URIRef(LICENSE_URIS[license_key])
        if normalized_license.startswith(("http://", "https://")):
            return URIRef(normalized_license)
        return Literal(normalized_license)

    def _split_ids(self, id_string: Optional[str]) -> List[str]:
        """Split comma-separated IDs"""
        if not id_string:
            return []
        return [id.strip() for id in str(id_string).split(",")]

    def create_datasets(self):
        """Create DCAT Datasets from datasets, with opt-in folder publication units."""
        datasets_by_folder = defaultdict(list)
        for dataset in self.datasets:
            folder = self._get_publication_folder(dataset)
            if folder:
                datasets_by_folder[folder["id"]].append(dataset)
                continue

            dataset_uri = self._get_dataset_uri(dataset["id"])
            self._add_dataset_metadata(dataset_uri, dataset)

            if dataset.get("link") or dataset.get("data_path"):
                self._create_distribution(dataset_uri, dataset, parent_id=dataset["id"])

        for folder_id, child_datasets in datasets_by_folder.items():
            folder = self.folders[folder_id]
            dataset_uri = self._get_dataset_uri(folder_id)
            self._add_dataset_metadata(dataset_uri, folder)
            for child_dataset in child_datasets:
                self._create_distribution(
                    dataset_uri, child_dataset, child_dataset["id"], folder_id
                )

        self.dcat_dataset_count = len(self._get_dcat_dataset_ids())

    def _add_dataset_metadata(self, dataset_uri: URIRef, item: Dict):
        self.graph.add((dataset_uri, RDF.type, DCAT.Dataset))

        org_id = self.config.get("organization_slug", "datannur")
        identifier = f"{item['id']}@{org_id}"
        self.graph.add((dataset_uri, DCTERMS.identifier, Literal(identifier)))

        if item.get("name"):
            self.graph.add(
                (dataset_uri, DCTERMS.title, self._get_language_literal(item["name"]))
            )

        if item.get("description"):
            self.graph.add(
                (
                    dataset_uri,
                    DCTERMS.description,
                    self._get_language_literal(item["description"]),
                )
            )

        if item.get("owner_organization_id"):
            self._add_publisher(dataset_uri, item["owner_organization_id"])

        if item.get("manager_organization_id"):
            self._add_contact_point(dataset_uri, item["manager_organization_id"])
        elif item.get("owner_organization_id"):
            self._add_contact_point(dataset_uri, item["owner_organization_id"])

        if item.get("start_date"):
            issued_date = self._parse_date(item["start_date"])
            if issued_date:
                self.graph.add((dataset_uri, DCTERMS.issued, issued_date))

        if item.get("last_update_date"):
            modified_date = self._parse_date(
                item["last_update_date"], "last_update_date"
            )
            if modified_date:
                self.graph.add((dataset_uri, DCTERMS.modified, modified_date))

        for tag_id in self._split_ids(item.get("tag_ids")):
            if tag_id in self.tags:
                tag_name = self.tags[tag_id].get("name")
                if tag_name:
                    self.graph.add(
                        (
                            dataset_uri,
                            DCAT.keyword,
                            self._get_language_literal(tag_name),
                        )
                    )
                    theme_uri = self._get_theme_uri(tag_id)
                    self.graph.add((dataset_uri, DCAT.theme, theme_uri))
                    self.graph.add((theme_uri, RDF.type, SKOS.Concept))
                    self.graph.add(
                        (
                            theme_uri,
                            SKOS.prefLabel,
                            self._get_language_literal(tag_name),
                        )
                    )

        if item.get("start_date") or item.get("end_date"):
            temporal_node = BNode()
            self.graph.add((dataset_uri, DCTERMS.temporal, temporal_node))
            self.graph.add((temporal_node, RDF.type, DCTERMS.PeriodOfTime))

            start = self._parse_temporal_date(item.get("start_date"), "start")
            end = self._parse_temporal_date(item.get("end_date"), "end")

            if start:
                self.graph.add((temporal_node, SCHEMA.startDate, start))
            if end:
                self.graph.add((temporal_node, SCHEMA.endDate, end))

        if item.get("localisation"):
            self.graph.add(
                (
                    dataset_uri,
                    DCTERMS.spatial,
                    self._get_language_literal(item["localisation"]),
                )
            )

        if item.get("updating_each"):
            freq_mapping = {
                "annuel": "http://publications.europa.eu/resource/authority/frequency/ANNUAL",
                "annuelle": "http://publications.europa.eu/resource/authority/frequency/ANNUAL",
                "mensuel": "http://publications.europa.eu/resource/authority/frequency/MONTHLY",
                "mensuelle": "http://publications.europa.eu/resource/authority/frequency/MONTHLY",
                "quotidien": "http://publications.europa.eu/resource/authority/frequency/DAILY",
                "quotidienne": "http://publications.europa.eu/resource/authority/frequency/DAILY",
                "hebdomadaire": "http://publications.europa.eu/resource/authority/frequency/WEEKLY",
            }
            freq_uri = freq_mapping.get(item["updating_each"].lower())
            if freq_uri:
                self.graph.add(
                    (dataset_uri, DCTERMS.accrualPeriodicity, URIRef(freq_uri))
                )

        for doc_id in self._split_ids(item.get("doc_ids")):
            if doc_id in self.docs:
                doc = self.docs[doc_id]
                doc_link = doc.get("link") or doc.get("path")
                if doc_link:
                    doc_uri = URIRef(doc_link)
                    self.graph.add((dataset_uri, DCTERMS.relation, doc_uri))
                    if doc.get("name"):
                        self.graph.add(
                            (
                                doc_uri,
                                RDFS.label,
                                self._get_language_literal(doc["name"]),
                            )
                        )

    def _add_publisher(self, dataset_uri: URIRef, organization_id: str):
        """Add publisher information (foaf:Agent)"""
        if organization_id not in self.organizations:
            return

        organization = self.organizations[organization_id]
        publisher_uri = URIRef(
            f"{self.config.get('base_uri', 'https://example.org/')}publisher/{organization_id}"
        )

        self.graph.add((dataset_uri, DCTERMS.publisher, publisher_uri))
        self.graph.add((publisher_uri, RDF.type, FOAF.Agent))

        if organization.get("name"):
            self.graph.add(
                (
                    publisher_uri,
                    FOAF.name,
                    self._get_language_literal(organization["name"]),
                )
            )

    def _add_contact_point(self, dataset_uri: URIRef, organization_id: str):
        """Add contact point information (vcard:Kind)"""
        if organization_id not in self.organizations:
            return

        organization = self.organizations[organization_id]
        contact_uri = URIRef(
            f"{self.config.get('base_uri', 'https://example.org/')}contact/{organization_id}"
        )

        self.graph.add((dataset_uri, DCAT.contactPoint, contact_uri))
        self.graph.add((contact_uri, RDF.type, VCARD.Organization))

        if organization.get("name"):
            self.graph.add((contact_uri, VCARD.fn, Literal(organization["name"])))

        if organization.get("email"):
            email_uri = URIRef(f"mailto:{organization['email']}")
            self.graph.add((contact_uri, VCARD.hasEmail, email_uri))

        if organization.get("phone"):
            phone_uri = URIRef(f"tel:{quote(str(organization['phone']), safe='+')}")
            self.graph.add((contact_uri, VCARD.hasTelephone, phone_uri))

    def _create_distribution(
        self,
        dataset_uri: URIRef,
        dataset: Dict,
        dist_id: str = "1",
        parent_id: Optional[str] = None,
    ):
        """Create distribution for a dataset (only called if link exists)"""
        dist_uri = self._get_distribution_uri(parent_id or dataset["id"], dist_id)

        self.graph.add((dataset_uri, DCAT.distribution, dist_uri))
        self.graph.add((dist_uri, RDF.type, DCAT.Distribution))

        # Mandatory: access URL
        access_url = str(dataset.get("link") or dataset.get("data_path") or "")
        if not access_url:
            return
        if not access_url.startswith("http"):
            access_url = (
                f"{self.config.get('base_uri', 'https://example.org/')}{access_url}"
            )
        self.graph.add((dist_uri, DCAT.accessURL, URIRef(access_url)))

        # Optional: download URL
        download_url = dataset.get("data_path") or access_url
        if download_url and dataset.get("delivery_format"):
            self.graph.add((dist_uri, DCAT.downloadURL, URIRef(download_url)))

        # Mandatory: issued date
        issued_date = self._parse_date(
            dataset.get("start_date", datetime.now().strftime("%Y-%m-%d"))
        )
        if issued_date:
            self.graph.add((dist_uri, DCTERMS.issued, issued_date))

        # Mandatory: license
        license_uri = dataset.get("license") or self.config.get(
            "default_license", "http://dcat-ap.ch/vocabulary/licenses/terms_open"
        )
        self.graph.add((dist_uri, DCTERMS.license, self._license_value(license_uri)))

        delivery_format = dataset.get("delivery_format")
        normalized_format = delivery_format.lower() if delivery_format else ""

        # Conditional: format
        if dataset.get("delivery_format"):
            format_uri = FILE_TYPE_URIS.get(normalized_format)
            if format_uri:
                self.graph.add((dist_uri, DCTERMS.format, URIRef(format_uri)))

        # Conditional: media type
        if dataset.get("delivery_format"):
            media_type = MEDIA_TYPES.get(normalized_format)
            if media_type:
                self.graph.add((dist_uri, DCAT.mediaType, Literal(media_type)))

        if dataset.get("data_size"):
            self.graph.add(
                (
                    dist_uri,
                    DCAT.byteSize,
                    Literal(Decimal(str(dataset["data_size"])), datatype=XSD.decimal),
                )
            )

        # Conditional: modified date
        if dataset.get("last_update_date"):
            modified_date = self._parse_date(
                dataset["last_update_date"], "last_update_date"
            )
            if modified_date:
                self.graph.add((dist_uri, DCTERMS.modified, modified_date))

        self.distributions.append(
            {
                "dataset_id": dataset.get("id", ""),
                "dataset_title": dataset.get("name") or dataset.get("id", ""),
                "access_url": access_url,
                "download_url": download_url if delivery_format else "",
                "format": delivery_format or "",
                "media_type": MEDIA_TYPES.get(normalized_format, ""),
                "license": license_uri,
            }
        )

    def build_internal_validation(self) -> List[Dict]:
        """Build profile-inspired checks when official SHACL validation is unavailable."""
        checks = []
        datasets_by_folder = self._get_datasets_by_publication_folder()
        for item in self._get_report_items():
            self._validate_published_dataset(item, checks)

        for child_datasets in datasets_by_folder.values():
            for dataset in child_datasets:
                self._validate_distribution(dataset, checks)

        self.validation_results = checks
        return checks

    def _add_validation_warning(
        self,
        checks: List[Dict],
        item: Dict,
        entity_type: str,
        code: str,
        message: str,
        field: str,
    ):
        item_id = item.get("id", "")
        checks.append(
            {
                "severity": "warning",
                "code": code,
                "entityType": entity_type,
                "entityId": item_id,
                "entityLabel": item.get("name") or item_id,
                "field": field,
                "message": message,
            }
        )

    def _validate_published_dataset(self, item: Dict, checks: List[Dict]):
        def add_warning(code: str, message: str, field: str):
            self._add_validation_warning(checks, item, "dataset", code, message, field)

        if not item.get("name"):
            add_warning("missing_title", "Dataset title is missing.", "name")
        if not item.get("description"):
            add_warning(
                "missing_description",
                "Dataset description is missing.",
                "description",
            )
        if not item.get("owner_organization_id"):
            add_warning(
                "missing_publisher",
                "Publisher organization is missing.",
                "owner_organization_id",
            )
        if not self._has_distribution_access_url(item):
            add_warning(
                "missing_distribution_url",
                "No distribution access URL is available.",
                "link,data_path",
            )
        if not item.get("tag_ids"):
            add_warning("missing_theme", "Dataset has no theme or keyword.", "tag_ids")

        for field, bound in [("start_date", "start"), ("end_date", "end")]:
            if not self._is_parseable_temporal_date(item.get(field), bound):
                add_warning(
                    "non_standard_date",
                    f"Temporal value '{item.get(field)}' could not be normalized.",
                    field,
                )

        if not self._is_parseable_date(
            item.get("last_update_date"), "last_update_date"
        ):
            add_warning(
                "non_standard_date",
                f"Date value '{item.get('last_update_date')}' could not be normalized.",
                "last_update_date",
            )

    def _validate_distribution(self, dataset: Dict, checks: List[Dict]):
        def add_warning(code: str, message: str, field: str):
            self._add_validation_warning(
                checks, dataset, "distribution", code, message, field
            )

        if not dataset.get("link") and not dataset.get("data_path"):
            add_warning(
                "missing_distribution_url",
                "Distribution access URL is missing.",
                "link,data_path",
            )
        if not dataset.get("license"):
            add_warning(
                "missing_license",
                "Distribution does not define a license; the configured default is used.",
                "license",
            )

        delivery_format = dataset.get("delivery_format")
        if delivery_format and delivery_format.lower() not in FILE_TYPE_URIS:
            add_warning(
                "unclear_format",
                f"Distribution format '{delivery_format}' is not mapped to a standard EU file type.",
                "delivery_format",
            )

        if not self._is_parseable_date(
            dataset.get("last_update_date"), "last_update_date"
        ):
            add_warning(
                "non_standard_date",
                f"Date value '{dataset.get('last_update_date')}' could not be normalized.",
                "last_update_date",
            )

    def get_summary(self) -> Dict:
        report_items = self._get_report_items()
        publishers = {
            item.get("owner_organization_id")
            for item in report_items
            if item.get("owner_organization_id")
        }
        licenses = Counter(
            item.get("license") or self.config.get("default_license", "")
            for item in report_items
        )
        formats = Counter(
            dataset.get("delivery_format") or "unknown" for dataset in self.datasets
        )
        themes = Counter()
        for item in report_items:
            for tag_id in self._split_ids(item.get("tag_ids")):
                tag = self.tags.get(tag_id, {})
                themes[tag.get("name") or tag_id] += 1

        return {
            "datasets": self.dcat_dataset_count or len(report_items),
            "distributions": len(self.distributions),
            "publishers": len(publishers),
            "licenses": dict(licenses.most_common()),
            "formats": dict(formats.most_common()),
            "themes": dict(themes.most_common()),
        }

    def _get_report_items(self) -> List[Dict]:
        items = []
        seen = set()
        for dataset in self.datasets:
            folder = self._get_publication_folder(dataset)
            item = folder or dataset
            item_id = item["id"]
            if item_id in seen:
                continue
            seen.add(item_id)
            items.append(item)
        return items

    def _has_distribution_access_url(self, item: Dict) -> bool:
        if item.get("link") or item.get("data_path"):
            return True

        child_datasets = self._get_datasets_by_publication_folder().get(item["id"], [])
        return any(
            dataset.get("link") or dataset.get("data_path")
            for dataset in child_datasets
        )

    def get_required_field_coverage(self) -> Dict:
        report_items = self._get_report_items()
        total = len(report_items)

        def coverage(label: str, count: int) -> Dict:
            percent = round((count / total) * 100, 1) if total else 100
            return {"label": label, "count": count, "total": total, "percent": percent}

        return {
            "title": coverage(
                "Title", sum(1 for item in report_items if item.get("name"))
            ),
            "description": coverage(
                "Description",
                sum(1 for item in report_items if item.get("description")),
            ),
            "publisher": coverage(
                "Publisher",
                sum(1 for item in report_items if item.get("owner_organization_id")),
            ),
            "contact_point": coverage(
                "Contact point",
                sum(
                    1
                    for item in report_items
                    if item.get("manager_organization_id")
                    or item.get("owner_organization_id")
                ),
            ),
            "distribution_access_url": coverage(
                "Distribution access URL",
                sum(
                    1
                    for item in report_items
                    if self._has_distribution_access_url(item)
                ),
            ),
            "license": coverage(
                "License", sum(1 for item in report_items if item.get("license"))
            ),
        }

    def get_validation_status(self, shacl_conforms: Optional[bool]) -> str:
        if shacl_conforms is False:
            return "errors"
        if self.validation_results:
            return "warnings"
        if shacl_conforms is None:
            return "notValidated"
        return "conforms"

    def export(self, output_file: Path, format: str = "xml"):
        """Export to RDF file"""
        format_map = {
            "xml": "xml",
            "rdf": "xml",
            "turtle": "turtle",
            "ttl": "turtle",
            "n3": "n3",
            "nt": "nt",
            "jsonld": "json-ld",
            "json-ld": "json-ld",
            "json": "json-ld",
        }

        rdf_format = format_map.get(format.lower(), "xml")

        self.graph.serialize(
            destination=output_file, format=rdf_format, encoding="utf-8"
        )
        print(
            f"✓ Exported {self.dcat_dataset_count or len(self.datasets)} datasets to {output_file}"
        )
        print(f"  Format: {rdf_format.upper()}")
        print(f"  Total triples: {len(self.graph)}")

    def export_all(self, output_dir: Path) -> Dict[str, str]:
        output_dir.mkdir(exist_ok=True)
        files = {"ttl": "dcat.ttl", "jsonld": "dcat.jsonld"}
        if self.config.get("include_rdf_xml", True):
            files["rdf"] = "dcat.rdf"

        formats = {"ttl": "ttl", "jsonld": "jsonld", "rdf": "rdf"}
        for key, filename in files.items():
            self.export(output_dir / filename, formats[key])

        return files

    def validate(self, shacl_file: Path) -> Tuple[Optional[bool], str]:
        """Validate exported RDF against DCAT-AP SHACL shapes"""
        if validate_shacl is None:
            return (
                None,
                "pyshacl is not available. Official SHACL validation was skipped.",
            )

        if not shacl_file.exists():
            print(f"⚠️  SHACL shapes not found at {shacl_file}, skipping validation")
            return (
                None,
                "SHACL shapes are not bundled. Official SHACL validation was skipped.",
            )

        print()
        print("Validating against DCAT-AP SHACL shapes...")

        conforms, _, results_text = validate_shacl(
            self.graph,
            shacl_graph=str(shacl_file),
            inference="rdfs",
            abort_on_first=False,
        )

        if conforms:
            print("✓ Validation passed - DCAT-AP compliant")
            return True, results_text

        print("❌ Validation failed")
        print()
        print(results_text)
        return False, results_text

    def write_validation_json(
        self,
        output_dir: Path,
        files: Dict[str, str],
        shacl_conforms: Optional[bool],
        shacl_message: str,
    ) -> Dict:
        generated_at = datetime.now(timezone.utc).isoformat()
        status = self.get_validation_status(shacl_conforms)
        payload = {
            "profile": self.config.get("profile", "DCAT-AP-CH"),
            "generatedAt": generated_at,
            "validation": {
                "status": status,
                "officialConformance": shacl_conforms is True,
                "shaclAvailable": shacl_conforms is not None,
                "message": shacl_message,
                "results": self.validation_results,
            },
            "counts": self.get_summary(),
            "coverage": self.get_required_field_coverage(),
            "files": {**files, "report": "dcat-report.html"},
        }
        with open(output_dir / "validation.json", "w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, indent=2)
        validation_json = json.dumps(payload, ensure_ascii=False, indent=2).replace(
            "</", "<\\/"
        )
        with open(output_dir / "validation.json.js", "w", encoding="utf-8") as file:
            file.write(f"window.datannurSemanticValidation = {validation_json};\n")
        return payload

    def write_html_report(self, output_dir: Path, validation: Dict):
        warnings_by_entity = defaultdict(list)
        for result in self.validation_results:
            entity_label = f"{result['entityType']}: {result['entityLabel']}"
            warnings_by_entity[entity_label].append(result)

        coverage_rows = "".join(
            f"<tr><td>{escape(item['label'])}</td><td>{item['count']} / {item['total']}</td><td>{item['percent']}%</td></tr>"
            for item in validation["coverage"].values()
        )
        warning_rows = (
            "".join(
                f"<tr><td>{escape(dataset)}</td><td>{escape(', '.join(warning['message'] for warning in warnings))}</td></tr>"
                for dataset, warnings in warnings_by_entity.items()
            )
            or "<tr><td colspan='2'>No profile-inspired warnings were detected.</td></tr>"
        )
        distribution_rows = (
            "".join(
                f"<tr><td>{escape(distribution['dataset_title'])}</td><td>{self._link(distribution['access_url'])}</td><td>{self._link(distribution['download_url'])}</td><td>{escape(distribution['format'])}</td><td>{escape(distribution['media_type'])}</td><td>{escape(distribution['license'])}</td></tr>"
                for distribution in self.distributions
            )
            or "<tr><td colspan='6'>No distributions were generated.</td></tr>"
        )
        vocabulary_rows = self._frequency_section(validation["counts"])
        file_links = "".join(
            f"<li><a href='{escape(filename)}'>{escape(label)}</a></li>"
            for label, filename in validation["files"].items()
            if label != "report"
        )
        shacl_summary = self._shacl_summary_section(validation)
        shacl_text = escape(
            validation["validation"].get("message") or "No SHACL result text available."
        )

        html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DCAT interoperability report</title>
  <style>
    body {{ font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2933; margin: 0; background: #f6f8fa; }}
    main {{ max-width: 1180px; margin: 0 auto; padding: 32px 24px 56px; }}
    h1, h2 {{ color: #102a43; }}
    h1 {{ margin-bottom: 4px; }}
    section {{ background: #fff; border: 1px solid #d9e2ec; border-radius: 6px; padding: 20px; margin-top: 18px; }}
    .meta {{ color: #52606d; margin-top: 0; }}
    .status {{ display: inline-block; padding: 4px 10px; border-radius: 4px; background: #fff3c4; color: #8d2b0b; font-weight: 700; text-transform: uppercase; font-size: 12px; }}
    .status.conforms {{ background: #d9f7e8; color: #0b6b3a; }}
    .status.errors {{ background: #ffe3e3; color: #a61b1b; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }}
    .metric {{ border: 1px solid #e4e7eb; border-radius: 4px; padding: 14px; }}
    .metric strong {{ display: block; font-size: 28px; color: #102a43; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
    th, td {{ border-bottom: 1px solid #e4e7eb; padding: 9px 8px; text-align: left; vertical-align: top; }}
    th {{ background: #f0f4f8; color: #334e68; }}
    code, pre {{ background: #f0f4f8; border-radius: 4px; }}
    pre {{ padding: 12px; overflow: auto; white-space: pre-wrap; }}
        details {{ margin-top: 14px; }}
        summary {{ cursor: pointer; color: #334e68; font-weight: 700; }}
    a {{ color: #1864ab; }}
  </style>
</head>
<body>
<main>
  <h1>DCAT interoperability report</h1>
  <p class="meta">Profile: {escape(validation['profile'])} · Generated: {escape(validation['generatedAt'])}</p>
  <p><span class="status {escape(validation['validation']['status'])}">{escape(validation['validation']['status'].replace('_', ' '))}</span></p>
  <section>
    <h2>Overview</h2>
    <div class="grid">
      <div class="metric"><strong>{validation['counts']['datasets']}</strong>Datasets</div>
      <div class="metric"><strong>{validation['counts']['distributions']}</strong>Distributions</div>
      <div class="metric"><strong>{validation['counts']['publishers']}</strong>Publishers</div>
      <div class="metric"><strong>{len(self.validation_results)}</strong>Warnings</div>
    </div>
  </section>
  <section><h2>Required fields coverage</h2><table><thead><tr><th>Field</th><th>Coverage</th><th>Percent</th></tr></thead><tbody>{coverage_rows}</tbody></table></section>
    <section><h2>Warnings by entity</h2><table><thead><tr><th>Entity</th><th>Warnings</th></tr></thead><tbody>{warning_rows}</tbody></table></section>
  <section><h2>Distribution table</h2><table><thead><tr><th>Dataset</th><th>Access URL</th><th>Download URL</th><th>Format</th><th>Media type</th><th>License</th></tr></thead><tbody>{distribution_rows}</tbody></table></section>
  <section><h2>Vocabulary usage</h2>{vocabulary_rows}</section>
    <section><h2>SHACL results</h2>{shacl_summary}<details><summary>Full raw SHACL output</summary><pre>{shacl_text}</pre></details></section>
  <section><h2>Export files</h2><ul>{file_links}</ul></section>
</main>
</body>
</html>
"""
        with open(output_dir / "dcat-report.html", "w", encoding="utf-8") as file:
            file.write(html)

    def _link(self, url: str) -> str:
        if not url:
            return ""
        safe_url = escape(url, quote=True)
        return f"<a href='{safe_url}'>{escape(url)}</a>"

    def _shacl_summary_section(self, validation: Dict) -> str:
        validation_info = validation["validation"]
        message = validation_info.get("message") or ""
        conforms = "Yes" if validation_info.get("officialConformance") else "No"
        if not validation_info.get("shaclAvailable"):
            return f"<p>{escape(message)}</p>"

        result_blocks = re.split(r"\n(?=Constraint Violation)", message)
        violations = [
            block for block in result_blocks if "Constraint Violation" in block
        ]
        paths = sorted(set(re.findall(r"Result Path:\s*([^\n]+)", message)))
        resources = sorted(set(re.findall(r"Focus Node:\s*([^\n]+)", message)))

        def list_items(values: List[str]) -> str:
            return "".join(f"<li><code>{escape(value)}</code></li>" for value in values)

        path_content = list_items(paths) or "<li>No failing paths reported.</li>"
        resource_content = (
            list_items(resources) or "<li>No affected resources reported.</li>"
        )
        return f"""
    <div class="grid">
      <div class="metric"><strong>{escape(conforms)}</strong>Conforms</div>
      <div class="metric"><strong>{len(violations)}</strong>Violations</div>
    </div>
    <h3>Failing paths</h3><ul>{path_content}</ul>
    <h3>Affected resources</h3><ul>{resource_content}</ul>
"""

    def _frequency_section(self, counts: Dict) -> str:
        sections = []
        for key, title in [
            ("formats", "File types"),
            ("licenses", "Licenses"),
            ("themes", "Themes"),
        ]:
            rows = (
                "".join(
                    f"<tr><td>{escape(str(label))}</td><td>{count}</td></tr>"
                    for label, count in counts[key].items()
                )
                or "<tr><td colspan='2'>No values</td></tr>"
            )
            sections.append(
                f"<h3>{title}</h3><table><thead><tr><th>Value</th><th>Count</th></tr></thead><tbody>{rows}</tbody></table>"
            )
        return "".join(sections)


def load_config(config_file: Path) -> Dict:
    """Load configuration file"""
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)

    # Default configuration
    return {
        "catalog_uri": "https://example.org/catalog",
        "base_uri": "https://example.org/",
        "organization_slug": "datannur",
        "default_license": "http://dcat-ap.ch/vocabulary/licenses/terms_open",
        "languages": ["fr", "de", "it", "en"],
    }


def main():
    """Main entry point"""
    from _local_runtime import DATA_DIR, DATA_TEMPLATE_DIR

    data_dir = DATA_DIR

    # Configuration (load from data/ directory, fallback to template)
    config_file = data_dir / "dcat-export.config.json"
    if not config_file.exists():
        config_file = DATA_TEMPLATE_DIR / "dcat-export.config.json"
    config = load_config(config_file)

    output_dir = data_dir / "db-semantic"
    output_dir.mkdir(exist_ok=True)

    # Export
    print("📊 Exporting datannur catalog to DCAT-AP-CH...")
    print(f"   Data directory: {data_dir}")
    print(f"   Output directory: {output_dir}")
    print()

    exporter = DCATExporter(data_dir, config)

    print("Loading data...")
    exporter.load_data()
    print(f"  ✓ {len(exporter.datasets)} datasets")
    print(f"  ✓ {len(exporter.organizations)} organizations")
    print(f"  ✓ {len(exporter.tags)} tags")
    print()

    print("Creating DCAT catalog...")
    exporter.create_catalog()
    exporter.create_datasets()
    print()

    print("Exporting...")
    files = exporter.export_all(output_dir)

    print("Building profile-inspired validation report...")
    exporter.build_internal_validation()

    # Validate
    shacl_file = SCHEMAS_DIR / "semantic" / "dcat-ap-shacl.ttl"
    shacl_conforms, shacl_message = exporter.validate(shacl_file)
    validation = exporter.write_validation_json(
        output_dir, files, shacl_conforms, shacl_message
    )
    exporter.write_html_report(output_dir, validation)
    print(f"✓ Wrote validation summary to {output_dir / 'validation.json'}")
    print(f"✓ Wrote publication readiness report to {output_dir / 'dcat-report.html'}")


if __name__ == "__main__":
    main()
