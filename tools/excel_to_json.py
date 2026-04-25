import pandas as pd
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]

excel_file = base / "data" / "epic_decks_inventory.xlsx"
output_file = base / "data" / "inventory.json"

df = pd.read_excel(
    excel_file,
    sheet_name="Inventory_Master",
    header=2
)

df = df.dropna(how="all")
df = df[df["sku"].notna()]
df = df.fillna("")

items = df.to_dict(orient="records")

featured_items = [
    item for item in items
    if str(item.get("featured_on_site", "")).strip().lower() == "yes"
]

featured_items.sort(
    key=lambda item: int(item.get("featured_rank") or 9999)
)

inventory_json = {
    "generated_items": len(items),
    "featured_items": featured_items,
    "all_items": items
}

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(inventory_json, f, indent=2, ensure_ascii=False)

print(f"Done. Exported {len(items)} total items.")
print(f"Featured items: {len(featured_items)}")
print(f"Saved to: {output_file}")