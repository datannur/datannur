#!/usr/bin/env python3
"""
Export datannur catalog to DCAT-AP-CH format (RDF/XML or Turtle)
Compatible with opendata.swiss standard
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, TYPE_CHECKING

from _local_runtime import find_data_db_dir

try:
    from rdflib import Graph, Namespace, Literal, URIRef, BNode
    from rdflib.namespace import RDF, RDFS, DCTERMS, FOAF, XSD
except ImportError as e:
    missing = str(e).split("'")[1] if "'" in str(e) else "rdflib"
    print(f"❌ Missing dependency: {missing}")
    print("   Install with: pip install rdflib")
    sys.exit(1)

if TYPE_CHECKING:
    from pyshacl import validate

try:
    from pyshacl import validate

    SHACL_AVAILABLE = True
except ImportError:
    SHACL_AVAILABLE = False

DCAT = Namespace("http://www.w3.org/ns/dcat#")
VCARD = Namespace("http://www.w3.org/2006/vcard/ns#")
SCHEMA = Namespace("http://schema.org/")


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

    def _bind_namespaces(self):
        """Bind RDF namespaces"""
        self.graph.bind("dcat", DCAT)
        self.graph.bind("dct", DCTERMS)
        self.graph.bind("foaf", FOAF)
        self.graph.bind("xsd", XSD)
        self.graph.bind("rdfs", RDFS)
        self.graph.bind("vcard", VCARD)
        self.graph.bind("schema", SCHEMA)

    def load_data(self):
        """Load JSON data from database files"""
        db_dir = find_data_db_dir(self.data_dir.parent)
        if db_dir is None:
            raise FileNotFoundError(
                "Data directory not found (no JSON files in data/db/)"
            )

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

        for dataset in self.datasets:
            dataset_uri = self._get_dataset_uri(dataset["id"])
            self.graph.add((catalog_uri, DCAT.dataset, dataset_uri))

    def _get_dataset_uri(self, dataset_id: str) -> URIRef:
        """Generate URI for a dataset"""
        base_uri = self.config.get("base_uri", "https://example.org/")
        return URIRef(f"{base_uri}dataset/{dataset_id}")

    def _get_distribution_uri(self, dataset_id: str, dist_id: str = "1") -> URIRef:
        """Generate URI for a distribution"""
        base_uri = self.config.get("base_uri", "https://example.org/")
        return URIRef(f"{base_uri}dataset/{dataset_id}/distribution/{dist_id}")

    def _parse_date(self, date_value) -> Optional[Literal]:
        """Parse date from various formats to appropriate xsd datatype"""
        if not date_value:
            return None

        date_str = str(date_value)

        # Handle YYYY/MM/DD
        if "/" in date_str and len(date_str) >= 10:
            parts = date_str.split("/")
            if len(parts) == 3:
                iso_date = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                return Literal(iso_date, datatype=XSD.date)

        # Handle Year/Month format (YYYY/MM)
        if "/" in date_str:
            parts = date_str.split("/")
            if len(parts) == 2:
                iso_date = f"{parts[0]}-{parts[1].zfill(2)}"
                return Literal(iso_date, datatype=XSD.gYearMonth)

        # Handle YYYY-MM format (already ISO format for gYearMonth)
        if "-" in date_str and len(date_str) == 7:
            return Literal(date_str, datatype=XSD.gYearMonth)

        # Handle YYYY-MM-DD format
        if "-" in date_str and len(date_str) == 10:
            return Literal(date_str, datatype=XSD.date)

        # Year only
        if date_str.isdigit() and len(date_str) == 4:
            return Literal(date_str, datatype=XSD.gYear)

        return None

    def _get_language_literal(self, text: str, lang: str = "fr") -> Literal:
        """Create a language-tagged literal"""
        return Literal(text, lang=lang)

    def _split_ids(self, id_string: Optional[str]) -> List[str]:
        """Split comma-separated IDs"""
        if not id_string:
            return []
        return [id.strip() for id in str(id_string).split(",")]

    def create_datasets(self):
        """Create DCAT Datasets from datannur datasets"""
        for dataset in self.datasets:
            dataset_uri = self._get_dataset_uri(dataset["id"])

            # Dataset type
            self.graph.add((dataset_uri, RDF.type, DCAT.Dataset))

            # Mandatory: identifier (format: [Source-Dataset-ID]@[Source-Organisation-ID])
            org_id = self.config.get("organization_slug", "datannur")
            identifier = f"{dataset['id']}@{org_id}"
            self.graph.add((dataset_uri, DCTERMS.identifier, Literal(identifier)))

            # Mandatory: title (multilingual)
            if dataset.get("name"):
                self.graph.add(
                    (
                        dataset_uri,
                        DCTERMS.title,
                        self._get_language_literal(dataset["name"]),
                    )
                )

            # Mandatory: description (multilingual)
            if dataset.get("description"):
                self.graph.add(
                    (
                        dataset_uri,
                        DCTERMS.description,
                        self._get_language_literal(dataset["description"]),
                    )
                )

            # Mandatory: publisher (organization)
            if dataset.get("owner_id"):
                self._add_publisher(dataset_uri, dataset["owner_id"])

            # Mandatory: contact point
            if dataset.get("manager_id"):
                self._add_contact_point(dataset_uri, dataset["manager_id"])
            elif dataset.get("owner_id"):
                self._add_contact_point(dataset_uri, dataset["owner_id"])

            # Conditional: issued date
            if dataset.get("start_date"):
                issued_date = self._parse_date(dataset["start_date"])
                if issued_date:
                    self.graph.add((dataset_uri, DCTERMS.issued, issued_date))

            # Conditional: modified date
            if dataset.get("last_update_date"):
                modified_date = self._parse_date(dataset["last_update_date"])
                if modified_date:
                    self.graph.add((dataset_uri, DCTERMS.modified, modified_date))

            # Optional: keywords (tags)
            tag_ids = self._split_ids(dataset.get("tag_ids"))
            for tag_id in tag_ids:
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

            # Optional: temporal coverage
            if dataset.get("start_date") or dataset.get("end_date"):
                temporal_node = BNode()
                self.graph.add((dataset_uri, DCTERMS.temporal, temporal_node))
                self.graph.add((temporal_node, RDF.type, DCTERMS.PeriodOfTime))

                start = self._parse_date(dataset.get("start_date"))
                end = self._parse_date(dataset.get("end_date"))

                if start:
                    self.graph.add((temporal_node, SCHEMA.startDate, start))
                if end:
                    self.graph.add((temporal_node, SCHEMA.endDate, end))

            # Optional: spatial coverage
            if dataset.get("localisation"):
                self.graph.add(
                    (
                        dataset_uri,
                        DCTERMS.spatial,
                        self._get_language_literal(dataset["localisation"]),
                    )
                )

            # Optional: accrual periodicity
            if dataset.get("updating_each"):
                freq_mapping = {
                    "annuelle": "http://publications.europa.eu/resource/authority/frequency/ANNUAL",
                    "mensuelle": "http://publications.europa.eu/resource/authority/frequency/MONTHLY",
                    "quotidienne": "http://publications.europa.eu/resource/authority/frequency/DAILY",
                    "hebdomadaire": "http://publications.europa.eu/resource/authority/frequency/WEEKLY",
                }
                freq_uri = freq_mapping.get(dataset["updating_each"].lower())
                if freq_uri:
                    self.graph.add(
                        (dataset_uri, DCTERMS.accrualPeriodicity, URIRef(freq_uri))
                    )

            # Optional: related documents
            doc_ids = self._split_ids(dataset.get("doc_ids"))
            for doc_id in doc_ids:
                if doc_id in self.docs:
                    doc = self.docs[doc_id]
                    if doc.get("link"):
                        doc_uri = URIRef(doc["link"])
                        self.graph.add((dataset_uri, DCTERMS.relation, doc_uri))
                        if doc.get("name"):
                            self.graph.add(
                                (
                                    doc_uri,
                                    RDFS.label,
                                    self._get_language_literal(doc["name"]),
                                )
                            )

            # Distribution (only if dataset has a link)
            if dataset.get("link"):
                self._create_distribution(dataset_uri, dataset)

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

    def _create_distribution(self, dataset_uri: URIRef, dataset: Dict):
        """Create distribution for a dataset (only called if link exists)"""
        dist_uri = self._get_distribution_uri(dataset["id"])

        self.graph.add((dataset_uri, DCAT.distribution, dist_uri))
        self.graph.add((dist_uri, RDF.type, DCAT.Distribution))

        # Mandatory: access URL
        access_url = dataset["link"]
        if not access_url.startswith("http"):
            access_url = (
                f"{self.config.get('base_uri', 'https://example.org/')}{access_url}"
            )
        self.graph.add((dist_uri, DCAT.accessURL, URIRef(access_url)))

        # Optional: download URL (same as access URL if file is downloadable)
        if dataset.get("delivery_format"):
            self.graph.add((dist_uri, DCAT.downloadURL, URIRef(access_url)))

        # Mandatory: issued date
        issued_date = self._parse_date(
            dataset.get("start_date", datetime.now().strftime("%Y-%m-%d"))
        )
        if issued_date:
            self.graph.add((dist_uri, DCTERMS.issued, issued_date))

        # Mandatory: license
        license_uri = self.config.get(
            "default_license", "http://dcat-ap.ch/vocabulary/licenses/terms_open"
        )
        self.graph.add((dist_uri, DCTERMS.license, URIRef(license_uri)))

        # Conditional: format
        if dataset.get("delivery_format"):
            format_mapping = {
                "csv": "http://publications.europa.eu/resource/authority/file-type/CSV",
                "xlsx": "http://publications.europa.eu/resource/authority/file-type/XLSX",
                "xml": "http://publications.europa.eu/resource/authority/file-type/XML",
                "json": "http://publications.europa.eu/resource/authority/file-type/JSON",
                "pdf": "http://publications.europa.eu/resource/authority/file-type/PDF",
            }
            format_uri = format_mapping.get(dataset["delivery_format"].lower())
            if format_uri:
                self.graph.add((dist_uri, DCTERMS.format, URIRef(format_uri)))

        # Conditional: media type
        if dataset.get("delivery_format"):
            media_mapping = {
                "csv": "text/csv",
                "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xml": "application/xml",
                "json": "application/json",
                "pdf": "application/pdf",
            }
            media_type = media_mapping.get(dataset["delivery_format"].lower())
            if media_type:
                self.graph.add((dist_uri, DCAT.mediaType, Literal(media_type)))

        # Conditional: modified date
        if dataset.get("last_update_date"):
            modified_date = self._parse_date(dataset["last_update_date"])
            if modified_date:
                self.graph.add(
                    (
                        dist_uri,
                        DCTERMS.modified,
                        Literal(modified_date, datatype=XSD.date),
                    )
                )

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
        print(f"✓ Exported {len(self.datasets)} datasets to {output_file}")
        print(f"  Format: {rdf_format.upper()}")
        print(f"  Total triples: {len(self.graph)}")

    def validate(self, shacl_file: Path) -> bool:
        """Validate exported RDF against DCAT-AP SHACL shapes"""
        if not SHACL_AVAILABLE:
            print("⚠️  pyshacl not available, skipping validation")
            return True

        if not shacl_file.exists():
            print(f"⚠️  SHACL shapes not found at {shacl_file}, skipping validation")
            return True

        print()
        print("Validating against DCAT-AP SHACL shapes...")

        conforms, results_graph, results_text = validate(
            self.graph,
            shacl_graph=str(shacl_file),
            inference="rdfs",
            abort_on_first=False,
        )

        if conforms:
            print("✓ Validation passed - DCAT-AP compliant")
            return True
        else:
            print("❌ Validation failed")
            print()
            print(results_text)
            return False


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
    # Paths
    script_dir = Path(__file__).parent
    public_dir = script_dir.parent
    data_dir = public_dir / "data"

    # Configuration (load from data/ directory, fallback to template)
    config_file = data_dir / "dcat-export.config.json"
    if not config_file.exists():
        config_file = public_dir / "data-template" / "dcat-export.config.json"
    config = load_config(config_file)

    # Output format
    output_format = sys.argv[1] if len(sys.argv) > 1 else "xml"

    # Output file
    if len(sys.argv) > 2:
        output_file = Path(sys.argv[2])
    else:
        ext = "rdf" if output_format in ["xml", "rdf"] else output_format
        ext = "jsonld" if output_format in ["json", "json-ld", "jsonld"] else ext
        output_file = data_dir / "db-semantic" / f"dcat.{ext}"
        output_file.parent.mkdir(exist_ok=True)

    # Export
    print("📊 Exporting datannur catalog to DCAT-AP-CH...")
    print(f"   Data directory: {data_dir}")
    print(f"   Output file: {output_file}")
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
    exporter.export(output_file, output_format)

    # Validate
    shacl_file = public_dir / "schemas" / "semantic" / "dcat-ap-shacl.ttl"
    exporter.validate(shacl_file)


if __name__ == "__main__":
    main()
