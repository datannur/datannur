#!/usr/bin/env python3
"""
Export datannur catalog to DCAT-AP-CH oriented interoperability artifacts.
"""

from collections import Counter, defaultdict
from decimal import Decimal
import json
import re
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote, urljoin

from _local_runtime import SCHEMAS_DIR, require_data_db_dir
from export_common import load_config, parse_bbox, parse_epsg

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
GEOSPARQL = Namespace("http://www.opengis.net/ont/geosparql#")

FILE_TYPE_URIS = {
    "csv": "http://publications.europa.eu/resource/authority/file-type/CSV",
    "xls": "http://publications.europa.eu/resource/authority/file-type/XLS",
    "xlsx": "http://publications.europa.eu/resource/authority/file-type/XLSX",
    "xml": "http://publications.europa.eu/resource/authority/file-type/XML",
    "json": "http://publications.europa.eu/resource/authority/file-type/JSON",
    "parquet": "http://publications.europa.eu/resource/authority/file-type/PARQUET",
    "pdf": "http://publications.europa.eu/resource/authority/file-type/PDF",
    "sas": "http://publications.europa.eu/resource/authority/file-type/SAS",
    "encolonne": "http://publications.europa.eu/resource/authority/file-type/TXT",
}

MEDIA_TYPES = {
    "csv": "text/csv",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xml": "application/xml",
    "json": "application/json",
    "parquet": "application/vnd.apache.parquet",
    "pdf": "application/pdf",
    "sas": "application/x-sas-data",
    "encolonne": "text/plain",
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
        self.default_language = self.config.get(
            "default_language", self.config.get("language", "en")
        )
        self.languages = self.config.get("languages", ["en", "fr"])
        if self.default_language not in self.languages:
            self.languages = [self.default_language, *self.languages]
        # Target profile: "eu" (default, DCAT-AP 3 / GeoDCAT-AP) or "ch" (eCH-0200)
        self.profile = self.config.get("profile", "eu")
        self.catalog_publisher_uri = None
        self.catalog_contact_uri = None

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
        self.graph.bind("geosparql", GEOSPARQL)

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

        # Mandatory: publisher (+ a catalog contact used as fallback for datasets)
        base_uri = self.config.get("base_uri", "https://example.org/")
        catalog_publisher = self.config.get("catalog_publisher", "")
        if catalog_publisher:
            self.catalog_publisher_uri = URIRef(f"{base_uri}publisher/catalog")
            self.graph.add(
                (catalog_uri, DCTERMS.publisher, self.catalog_publisher_uri)
            )
            self.graph.add((self.catalog_publisher_uri, RDF.type, FOAF.Agent))
            self.graph.add(
                (
                    self.catalog_publisher_uri,
                    FOAF.name,
                    self._get_language_literal(catalog_publisher),
                )
            )
            self.catalog_contact_uri = URIRef(f"{base_uri}contact/catalog")
            self.graph.add((self.catalog_contact_uri, RDF.type, VCARD.Organization))
            self.graph.add((self.catalog_contact_uri, RDF.type, VCARD.Kind))
            self.graph.add(
                (self.catalog_contact_uri, VCARD.fn, Literal(catalog_publisher))
            )

        # License (required by DCAT-AP-CH on the catalog)
        license_uri = self.config.get("default_license")
        if license_uri:
            self.graph.add(
                (
                    catalog_uri,
                    DCTERMS.license,
                    self._typed(URIRef(license_uri), DCTERMS.LicenseDocument),
                )
            )

        # DCAT-AP-CH also requires an issued date and a homepage on the catalog.
        self.graph.add(
            (
                catalog_uri,
                DCTERMS.issued,
                Literal(
                    self.config.get("catalog_issued", "2024-01-01"), datatype=XSD.date
                ),
            )
        )
        homepage = self.config.get("catalog_homepage") or self.config.get("base_uri")
        if homepage:
            self.graph.add(
                (
                    catalog_uri,
                    FOAF.homepage,
                    self._typed(URIRef(homepage), FOAF.Document),
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

    def _absolute_url(self, url: str) -> str:
        base_uri = self.config.get("base_uri", "https://example.org/")
        return urljoin(f"{base_uri.rstrip('/')}/", url)

    def _encoded_uri_ref(self, uri: str) -> URIRef:
        return URIRef(quote(uri, safe=":/?#[]@!$&'()*+,;=%"))

    def _uri_ref(self, url: str) -> URIRef:
        return self._encoded_uri_ref(self._absolute_url(url))

    def _document_uri_ref(self, url: str) -> URIRef:
        normalized_url = str(url).strip()
        windows_path_match = re.match(r"^([A-Za-z]):[\\/](.*)$", normalized_url)

        if normalized_url.startswith(("\\\\", "//")):
            path = re.sub(r"[\\/]+", "/", normalized_url.lstrip("\\/"))
            return self._encoded_uri_ref(f"file://{path}")
        if windows_path_match:
            drive = windows_path_match.group(1).upper()
            path = re.sub(r"[\\/]+", "/", windows_path_match.group(2))
            return self._encoded_uri_ref(f"file:///{drive}:/{path}")
        if normalized_url.startswith("/"):
            return self._encoded_uri_ref(f"file://{normalized_url}")
        if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", normalized_url):
            return self._encoded_uri_ref(normalized_url)
        return self._uri_ref(normalized_url)

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

        # Year/Month (YYYY/MM) -> first of month (xsd:date: EU-ok, CH-required)
        if "/" in date_str:
            parts = date_str.split("/")
            if len(parts) == 2:
                return self._date_literal(f"{parts[0]}-{parts[1].zfill(2)}-01")

        # YYYY-MM -> first of month (xsd:date)
        if "-" in date_str and len(date_str) == 7:
            return self._date_literal(f"{date_str}-01")

        # Handle YYYY-MM-DD format
        if "-" in date_str and len(date_str) == 10:
            return self._date_literal(date_str)

        # Year only -> first of January (xsd:date)
        if date_str.isdigit() and len(date_str) == 4:
            return self._date_literal(f"{date_str}-01-01")

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

    def _localized_field(self, item: Dict, field: str) -> str:
        localized_value = item.get(f"{field}:{self.default_language}")
        if localized_value is not None and localized_value != "":
            return str(localized_value)
        value = item.get(field)
        return str(value) if value is not None else ""

    def _localized_fields(self, item: Dict, field: str) -> Dict[str, str]:
        values: Dict[str, str] = {}
        base_value = item.get(field)
        if base_value is not None and base_value != "":
            values["en"] = str(base_value)
        for language in self.languages:
            localized_value = item.get(f"{field}:{language}")
            if localized_value is not None and localized_value != "":
                values[language] = str(localized_value)
        return values

    def _add_language_literals(self, subject, predicate, item: Dict, field: str):
        for language, value in self._localized_fields(item, field).items():
            self.graph.add(
                (subject, predicate, self._get_language_literal(value, language))
            )

    def _get_language_literal(self, text: str, lang: Optional[str] = None) -> Literal:
        """Create a language-tagged literal"""
        return Literal(text, lang=lang or self.default_language)

    def _license_value(self, license_value: str):
        normalized_license = license_value.strip()
        license_key = normalized_license.lower().split(" - ")[0]
        if license_key in LICENSE_URIS:
            return URIRef(LICENSE_URIS[license_key])
        if normalized_license.startswith(("http://", "https://")):
            return URIRef(normalized_license)
        return Literal(normalized_license)

    def _effective_license(self, dataset: Dict, parent: Optional[Dict] = None) -> str:
        return (
            dataset.get("license")
            or (parent or {}).get("license")
            or self.config.get("default_license")
            or ""
        )

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
                    dataset_uri, child_dataset, child_dataset["id"], folder_id, folder
                )

        self.dcat_dataset_count = len(self._get_dcat_dataset_ids())

    def _add_dataset_metadata(self, dataset_uri: URIRef, item: Dict):
        self.graph.add((dataset_uri, RDF.type, DCAT.Dataset))

        org_id = self.config.get("organization_slug", "datannur")
        identifier = f"{item['id']}@{org_id}"
        self.graph.add((dataset_uri, DCTERMS.identifier, Literal(identifier)))

        self._add_language_literals(dataset_uri, DCTERMS.title, item, "name")
        self._add_language_literals(
            dataset_uri, DCTERMS.description, item, "description"
        )

        self._add_responsible(dataset_uri, item)

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
                tag_names = self._localized_fields(self.tags[tag_id], "name")
                if tag_names:
                    theme_uri = self._get_theme_uri(tag_id)
                    self.graph.add((dataset_uri, DCAT.theme, theme_uri))
                    self.graph.add((theme_uri, RDF.type, SKOS.Concept))
                    for language, tag_name in tag_names.items():
                        self.graph.add(
                            (
                                dataset_uri,
                                DCAT.keyword,
                                self._get_language_literal(tag_name, language),
                            )
                        )
                        self.graph.add(
                            (
                                theme_uri,
                                SKOS.prefLabel,
                                self._get_language_literal(tag_name, language),
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

        self._add_spatial(dataset_uri, item)

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
                    (
                        dataset_uri,
                        DCTERMS.accrualPeriodicity,
                        self._typed(URIRef(freq_uri), DCTERMS.Frequency),
                    )
                )

        for doc_id in self._split_ids(item.get("doc_ids")):
            if doc_id in self.docs:
                doc = self.docs[doc_id]
                doc_link = doc.get("link") or doc.get("path")
                if doc_link:
                    doc_uri = self._document_uri_ref(doc_link)
                    self.graph.add((dataset_uri, DCTERMS.relation, doc_uri))
                    self._add_language_literals(doc_uri, RDFS.label, doc, "name")

    def _add_spatial(self, dataset_uri: URIRef, item: Dict):
        """Spatial coverage (GeoDCAT-AP): a dct:Location carrying the human
        label, the bounding box and centroid, plus the reference system and
        resolution on the dataset."""
        localisation = item.get("localisation")
        coords = parse_bbox(item.get("bbox"))

        if localisation or coords is not None:
            location = BNode()
            self.graph.add((dataset_uri, DCTERMS.spatial, location))
            self.graph.add((location, RDF.type, DCTERMS.Location))
            if localisation:
                self.graph.add(
                    (location, SKOS.prefLabel, self._get_language_literal(localisation))
                )
            if coords is not None:
                self._add_geometry(location, coords)

        # eCH-0200 forbids dct:conformsTo, so the CRS reference is EU-only.
        crs_uri = self._crs_uri(item.get("crs"))
        if crs_uri is not None and self.profile != "ch":
            self.graph.add(
                (
                    dataset_uri,
                    DCTERMS.conformsTo,
                    self._typed(crs_uri, DCTERMS.Standard),
                )
            )

        resolution = item.get("spatial_resolution")
        if isinstance(resolution, (int, float)) and not isinstance(resolution, bool):
            self.graph.add(
                (
                    dataset_uri,
                    DCAT.spatialResolutionInMeters,
                    Literal(Decimal(str(resolution)), datatype=XSD.decimal),
                )
            )

    def _add_geometry(self, location: BNode, coords: List[float]):
        """Bounding box and centroid as GeoSPARQL WKT (CRS84 lon/lat).

        DCAT-AP allows a single literal per geo property, so WKT — the most
        widely supported encoding — is used rather than several encodings."""
        west, south, east, north = coords
        ring = ", ".join(
            f"{lon} {lat}"
            for lon, lat in (
                (west, south),
                (east, south),
                (east, north),
                (west, north),
                (west, south),
            )
        )
        bbox = self._wkt(f"POLYGON(({ring}))")
        self.graph.add((location, DCAT.bbox, bbox))

        cx, cy = (west + east) / 2, (south + north) / 2
        self.graph.add((location, DCAT.centroid, self._wkt(f"POINT({cx} {cy})")))

    def _wkt(self, body: str) -> Literal:
        crs = "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>"
        return Literal(f"{crs} {body}", datatype=GEOSPARQL.wktLiteral)

    def _typed(self, node: URIRef, rdf_class: URIRef) -> URIRef:
        """Give an IRI object an explicit rdf:type. DCAT-AP / GeoDCAT-AP /
        DCAT-AP-CH expect typed resources for these properties; the type is
        additive and does not affect plain DCAT consumers."""
        self.graph.add((node, RDF.type, rdf_class))
        return node

    def _crs_uri(self, crs) -> Optional[URIRef]:
        """'EPSG:2056' -> OGC CRS register URI (spatial reference system)."""
        epsg = parse_epsg(crs)
        if epsg is None:
            return None
        return URIRef(f"http://www.opengis.net/def/crs/EPSG/0/{epsg}")

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

        self._add_language_literals(publisher_uri, FOAF.name, organization, "name")

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
        self.graph.add((contact_uri, RDF.type, VCARD.Kind))

        organization_name = self._localized_field(organization, "name")
        if organization_name:
            self.graph.add((contact_uri, VCARD.fn, Literal(organization_name)))

        if organization.get("email"):
            email_uri = URIRef(f"mailto:{organization['email']}")
            self.graph.add(
                (contact_uri, VCARD.hasEmail, self._typed(email_uri, VCARD.Email))
            )

        if organization.get("phone"):
            phone_uri = URIRef(f"tel:{quote(str(organization['phone']), safe='+')}")
            self.graph.add((contact_uri, VCARD.hasTelephone, phone_uri))

    def _add_responsible(self, subject: URIRef, item: Dict):
        """Publisher + contact point, falling back to the catalog's when the item
        has no organisation, so each one carries them (DCAT-AP-CH requires it)."""
        owner = item.get("owner_organization_id")
        manager = item.get("manager_organization_id")
        if owner in self.organizations:
            self._add_publisher(subject, owner)
        elif self.catalog_publisher_uri is not None:
            self.graph.add((subject, DCTERMS.publisher, self.catalog_publisher_uri))

        contact_org = manager if manager in self.organizations else owner
        if contact_org in self.organizations:
            self._add_contact_point(subject, contact_org)
        elif self.catalog_contact_uri is not None:
            self.graph.add((subject, DCAT.contactPoint, self.catalog_contact_uri))

    def _create_distribution(
        self,
        dataset_uri: URIRef,
        dataset: Dict,
        dist_id: str = "1",
        parent_id: Optional[str] = None,
        parent: Optional[Dict] = None,
    ):
        """Create distribution for a dataset (only called if link exists)"""
        dist_uri = self._get_distribution_uri(parent_id or dataset["id"], dist_id)

        self.graph.add((dataset_uri, DCAT.distribution, dist_uri))
        self.graph.add((dist_uri, RDF.type, DCAT.Distribution))

        # Mandatory: access URL
        access_url = str(dataset.get("link") or dataset.get("data_path") or "")
        if not access_url:
            return
        access_url = str(self._uri_ref(access_url))
        self.graph.add((dist_uri, DCAT.accessURL, URIRef(access_url)))

        # DCAT-AP-CH requires a publisher and contact point on each distribution.
        self._add_responsible(dist_uri, dataset)

        # Optional: download URL
        download_url = str(self._uri_ref(dataset.get("data_path") or access_url))
        if download_url and dataset.get("delivery_format"):
            self.graph.add((dist_uri, DCAT.downloadURL, URIRef(download_url)))

        # Mandatory (DCAT-AP-CH): issued date — fall back to the catalog date when
        # the dataset has none, so every distribution carries one.
        issued_date = self._parse_date(dataset.get("start_date")) or self._parse_date(
            self.config.get("catalog_issued", "2024-01-01")
        )
        if issued_date:
            self.graph.add((dist_uri, DCTERMS.issued, issued_date))

        # Mandatory: license
        license_uri = self._effective_license(dataset, parent)
        if license_uri:
            license_value = self._license_value(license_uri)
            if isinstance(license_value, URIRef):
                self._typed(license_value, DCTERMS.LicenseDocument)
            self.graph.add((dist_uri, DCTERMS.license, license_value))

        delivery_format = dataset.get("delivery_format")
        normalized_format = delivery_format.lower() if delivery_format else ""

        # Conditional: format
        if dataset.get("delivery_format"):
            format_uri = FILE_TYPE_URIS.get(normalized_format)
            if format_uri:
                self.graph.add(
                    (
                        dist_uri,
                        DCTERMS.format,
                        self._typed(URIRef(format_uri), DCTERMS.MediaTypeOrExtent),
                    )
                )

        # Conditional: media type
        if dataset.get("delivery_format"):
            media_type = MEDIA_TYPES.get(normalized_format)
            if media_type:
                media_uri = URIRef(
                    f"https://www.iana.org/assignments/media-types/{media_type}"
                )
                self.graph.add(
                    (dist_uri, DCAT.mediaType, self._typed(media_uri, DCTERMS.MediaType))
                )
                self.graph.add((media_uri, RDF.type, DCTERMS.MediaTypeOrExtent))

        # EU (DCAT-AP 3) wants a non-negative integer; eCH-0200's byteSize shape
        # expects a resource (incompatible with a byte count), so skip it in CH mode.
        if dataset.get("data_size") and self.profile != "ch":
            self.graph.add(
                (
                    dist_uri,
                    DCAT.byteSize,
                    Literal(int(dataset["data_size"]), datatype=XSD.nonNegativeInteger),
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
                "dataset_title": self._localized_field(dataset, "name")
                or dataset.get("id", ""),
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
                parent = self._get_publication_folder(dataset)
                self._validate_distribution(dataset, checks, parent)

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
        entity_labels = self._localized_fields(item, "name")
        checks.append(
            {
                "severity": "warning",
                "code": code,
                "entityType": entity_type,
                "entityId": item_id,
                "entityLabel": entity_labels.get(self.default_language)
                or entity_labels.get("en")
                or item_id,
                "entityLabels": entity_labels,
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

    def _validate_distribution(
        self, dataset: Dict, checks: List[Dict], parent: Optional[Dict] = None
    ):
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
        if not self._effective_license(dataset, parent):
            add_warning(
                "missing_license",
                "Distribution does not define a license and no package or default license is available.",
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
        theme_labels: Dict[str, Dict[str, str]] = {}
        for item in report_items:
            for tag_id in self._split_ids(item.get("tag_ids")):
                tag = self.tags.get(tag_id, {})
            tag_labels = self._localized_fields(tag, "name")
            label = tag_labels.get(self.default_language) or tag_id
            themes[label] += 1
            theme_labels[label] = tag_labels

        return {
            "datasets": self.dcat_dataset_count or len(report_items),
            "distributions": len(self.distributions),
            "publishers": len(publishers),
            "licenses": dict(licenses.most_common()),
            "formats": dict(formats.most_common()),
            "themes": dict(themes.most_common()),
            "themeItems": [
                {
                    "label": label,
                    "labels": theme_labels.get(label, {}),
                    "count": count,
                }
                for label, count in themes.most_common()
            ],
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

    def report_profile(self, label: str, shacl_file: Path) -> None:
        """Non-blocking conformance report against an additional profile.

        The primary DCAT-AP validation stays the gate; this only measures how
        close the output is to the EU (GeoDCAT-AP) and Swiss (DCAT-AP-CH) levels.
        """
        if validate_shacl is None or not shacl_file.exists():
            return
        conforms, _, results_text = validate_shacl(
            self.graph,
            shacl_graph=str(shacl_file),
            inference="rdfs",
            abort_on_first=False,
        )
        if conforms:
            print(f"  ✓ {label}: conformant")
        else:
            count = results_text.count("Constraint Violation")
            print(f"  • {label}: {count} issue(s) — informational, non-blocking")

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
            "files": files,
        }
        with open(output_dir / "validation.json", "w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, indent=2)
        validation_json = json.dumps(payload, ensure_ascii=False, indent=2).replace(
            "</", "<\\/"
        )
        with open(output_dir / "validation.json.js", "w", encoding="utf-8") as file:
            file.write(f"window.datannurSemanticValidation = {validation_json};\n")
        return payload


DEFAULT_CONFIG = {
    "catalog_uri": "https://example.org/catalog",
    "base_uri": "https://example.org/",
    "organization_slug": "datannur",
    "default_license": "http://dcat-ap.ch/vocabulary/licenses/terms_open",
    "default_language": "en",
    "languages": ["en", "fr", "de", "it"],
}


def main():
    """Main entry point"""
    from _local_runtime import DATA_DIR, DATA_TEMPLATE_DIR

    data_dir = DATA_DIR

    # Configuration (load from data/ directory, fallback to template)
    config_file = data_dir / "dcat-export.config.json"
    if not config_file.exists():
        config_file = DATA_TEMPLATE_DIR / "dcat-export.config.json"
    config = load_config(config_file, DEFAULT_CONFIG)
    # CLI override: `datannur dcat --profile ch`
    if "--profile" in sys.argv:
        index = sys.argv.index("--profile")
        if index + 1 < len(sys.argv):
            config["profile"] = sys.argv[index + 1]

    output_dir = data_dir / "db-semantic"
    output_dir.mkdir(exist_ok=True)
    stale_html_report = output_dir / "dcat-report.html"
    if stale_html_report.exists():
        stale_html_report.unlink()

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
    semantic_dir = SCHEMAS_DIR / "semantic"
    profiles = [
        ("DCAT-AP 3.0.1 (EU)", "dcat-ap-shacl.ttl", "eu"),
        ("GeoDCAT-AP 3.1 (EU)", "geodcat-ap-shacl.ttl", None),
        ("DCAT-AP-CH / eCH-0200 (CH)", "dcat-ap-ch-shacl.ttl", "ch"),
    ]
    primary_file = "dcat-ap-ch-shacl.ttl" if exporter.profile == "ch" else "dcat-ap-shacl.ttl"

    shacl_conforms, shacl_message = exporter.validate(semantic_dir / primary_file)
    exporter.write_validation_json(output_dir, files, shacl_conforms, shacl_message)
    print(f"✓ Wrote validation summary to {output_dir / 'validation.json'}")

    print()
    print(f"Profile: {exporter.profile} (primary, blocking)")
    print("Other profile conformance (informational, non-blocking):")
    for label, fname, _ in profiles:
        if fname != primary_file:
            exporter.report_profile(label, semantic_dir / fname)


if __name__ == "__main__":
    main()
