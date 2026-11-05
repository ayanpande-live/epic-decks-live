#!/usr/bin/env python3
"""Build a strictly curated PUBLIC catalogue from a PRIVATE founder-reviewed JSON file.

Never point this at a live stock feed without independent human verification.
No acquisition costs, reservations, customer data, private notes or unreviewed
inventory records are copied into the published JSON.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
from urllib.parse import urlsplit


PUBLIC_KEYS = (
    "sku", "item_title", "item_type", "set_name", "grade_company", "grade_value",
    "target_price", "currency", "hero_image", "whatnot_listing_url",
    "verified_at", "approved_for_publication", "availability_confirmed",
    "condition_confirmed", "photo_confirmed", "certificate_confirmed",
    "listing_status",
)
SKU = re.compile(r"[A-Z0-9-]{4,64}", re.ASCII)
IMAGE = re.compile(r"/images/inventory/[A-Za-z0-9/_.-]+\.(?:png|jpg|jpeg|webp)", re.I | re.ASCII)


class PublicationRejected(ValueError):
    pass


def verified_time(value: object, now: datetime) -> bool:
    if not isinstance(value, str):
        return False
    try:
        stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    if stamp.tzinfo is None:
        return False
    timestamp = stamp.astimezone(timezone.utc)
    return now - timedelta(days=14) <= timestamp <= now


def catalogue_from_approved(source: object, *, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("Must use timezone-aware validation time")
    if not isinstance(source, list) or len(source) > 50:
        raise PublicationRejected("Expected a reviewed list of up to 50 products")
    published = []
    seen = set()
    for index, raw in enumerate(source):
        if not isinstance(raw, dict):
            raise PublicationRejected(f"Product {index + 1}: invalid record")
        if any(raw.get(flag) is not True for flag in (
            "approved_for_publication", "availability_confirmed",
            "condition_confirmed", "photo_confirmed"
        )):
            raise PublicationRejected(f"Product {index + 1}: required review missing")
        if raw.get("listing_status") != "live":
            raise PublicationRejected(f"Product {index + 1}: listing is not live")
        if str(raw.get("item_type", "")).lower() == "slab" and raw.get("certificate_confirmed") is not True:
            raise PublicationRejected(f"Product {index + 1}: slab certificate not verified")
        sku = raw.get("sku")
        if not isinstance(sku, str) or not SKU.fullmatch(sku) or sku in seen:
            raise PublicationRejected(f"Product {index + 1}: missing/duplicate SKU")
        seen.add(sku)
        if not verified_time(raw.get("verified_at"), now):
            raise PublicationRejected(f"Product {index + 1}: physical stock verification expired")
        title = raw.get("item_title")
        if not isinstance(title, str) or not 3 <= len(title.strip()) <= 180:
            raise PublicationRejected(f"Product {index + 1}: missing title")
        price = raw.get("target_price")
        if isinstance(price, bool) or not isinstance(price, (int, float)) or not 0 < price < 100000:
            raise PublicationRejected(f"Product {index + 1}: invalid price")
        if raw.get("currency") != "EUR":
            raise PublicationRejected(f"Product {index + 1}: unsupported currency")
        image = raw.get("hero_image")
        if not isinstance(image, str) or not IMAGE.fullmatch(image) or ".." in image:
            raise PublicationRejected(f"Product {index + 1}: approved photo path missing")
        url = raw.get("whatnot_listing_url")
        if not isinstance(url, str):
            raise PublicationRejected(f"Product {index + 1}: listing link missing")
        parts = urlsplit(url)
        if (parts.scheme != "https" or parts.hostname not in ("whatnot.com", "www.whatnot.com")
            or not parts.path.startswith("/listing/") or len(parts.path) < 12
            or parts.username or parts.password or parts.fragment):
            raise PublicationRejected(f"Product {index + 1}: invalid listing URL")
        safe = {key: raw[key] for key in PUBLIC_KEYS if key in raw}
        safe["item_title"] = title.strip()
        safe["target_price"] = round(float(price), 2)
        published.append(safe)
    return {
        "schema_version": 1,
        "published_at": now.astimezone(timezone.utc).isoformat(timespec="seconds"),
        "items": published,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish safe, manually verified Whatnot catalogue")
    parser.add_argument("--reviewed-input", required=True,
                        help="Private JSON array of approved products (must not be within the public repository)")
    parser.add_argument("--output", required=True, help="Public catalogue output filename")
    args = parser.parse_args()
    try:
        source_path = Path(args.reviewed_input).resolve()
        out_path = Path(args.output).resolve()
        # Refuse source under this public repository entirely, even if gitignored.
        public_root = Path(__file__).resolve().parents[1]
        if source_path == public_root or public_root in source_path.parents:
            raise PublicationRejected("Private input must stay outside the public repository")
        source = json.loads(source_path.read_text(encoding="utf-8"))
        output = catalogue_from_approved(source)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = out_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        os.replace(tmp, out_path)
    except (PublicationRejected, OSError, ValueError, json.JSONDecodeError) as exc:
        print("Catalogue refused: " + str(exc))
        return 2
    print("Published exactly " + str(len(output["items"])) + " approved public product records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
