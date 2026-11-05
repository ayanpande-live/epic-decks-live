"""Synthetic data only. Never use or commit Epic Decks actual stock/cost data."""
import unittest
from datetime import datetime, timedelta, timezone

from tools.build_public_catalog import catalogue_from_approved, PublicationRejected

NOW = datetime(2026, 11, 5, 12, 0, tzinfo=timezone.utc)


def card():
    return {
        "sku": "ED-SLAB-DEMO01",
        "item_title": "Synthetic Collectible Example",
        "item_type": "Slab",
        "set_name": "Test Set",
        "grade_company": "ACE",
        "grade_value": 10,
        "target_price": 42.99,
        "currency": "EUR",
        "hero_image": "/images/inventory/test/example.webp",
        "whatnot_listing_url": "https://www.whatnot.com/listing/TGlzdGluZ0V4YW1wbGU=",
        "verified_at": NOW.isoformat(timespec="seconds"),
        "approved_for_publication": True,
        "availability_confirmed": True,
        "condition_confirmed": True,
        "certificate_confirmed": True,
        "photo_confirmed": True,
        "listing_status": "live",
        "purchase_price": 1.25,
        "private_notes": "Sensitive synthetic text that must never be exported",
        "reserved_qty": 0,
        "acquisition_cost_eur": 2.0,
    }


class PublicCatalogueTests(unittest.TestCase):
    def test_only_allowlisted_fields_released(self):
        data = catalogue_from_approved([card()], now=NOW)
        self.assertEqual(data["schema_version"], 1)
        self.assertEqual(len(data["items"]), 1)
        result = data["items"][0]
        self.assertEqual(result["sku"], "ED-SLAB-DEMO01")
        for key in ("purchase_price", "private_notes", "reserved_qty", "acquisition_cost_eur"):
            self.assertNotIn(key, result)

    def test_empty_feed_is_safe(self):
        self.assertEqual(catalogue_from_approved([], now=NOW)["items"], [])

    def test_missing_approval_is_rejected(self):
        item = card()
        item["approved_for_publication"] = False
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([item], now=NOW)

    def test_missing_certificate_is_rejected_for_slabs(self):
        item = card()
        item["certificate_confirmed"] = False
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([item], now=NOW)

    def test_outdated_availability_is_rejected(self):
        item = card()
        item["verified_at"] = (NOW - timedelta(days=15)).isoformat()
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([item], now=NOW)

    def test_duplicate_sku_rejected(self):
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([card(), card()], now=NOW)

    def test_malicious_image_path_rejected(self):
        item = card()
        item["hero_image"] = "/images/inventory/../../private/stock.webp"
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([item], now=NOW)

    def test_fake_checkout_url_rejected(self):
        item = card()
        item["whatnot_listing_url"] = "https://whatnot.com.evil.example/listing/x"
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([item], now=NOW)

    def test_empty_or_future_verification_rejected(self):
        item = card()
        item["verified_at"] = (NOW + timedelta(days=1)).isoformat()
        with self.assertRaises(PublicationRejected):
            catalogue_from_approved([item], now=NOW)


if __name__ == "__main__":
    unittest.main()
