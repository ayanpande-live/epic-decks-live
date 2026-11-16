import assert from "node:assert/strict";
import {reviewSourcingQuote} from "./pokebro-quote.mjs";
const base={currency:"EUR",item_eur:"200.00",seller_shipping_eur:"10.00",
  import_duty_eur:"0",nonrecoverable_import_vat_eur:"5.00",inspection_eur:"6",
  outbound_shipping_eur:"8",service_fee_eur:"12.00",other_eur:"4",
  max_budget_eur:"250",source_url:"https://example.org/listing/123",
  source_checked_at:"2026-11-16T10:00:00Z",seller_of_record_confirmed:true};
const q=reviewSourcingQuote(base);
assert.equal(q.ready_for_review,true);
assert.equal(q.all_in_eur,"245.00");
assert.equal(q.fits_budget,true);
assert.equal(q.difference_eur,"5.00");
assert.equal(q.purchase_authorized,false);
assert.equal(q.recommendation,"human_review_required");
const over=reviewSourcingQuote({...base,max_budget_eur:"240"});
assert.equal(over.fits_budget,false);
assert.equal(over.difference_kind,"over_budget");
assert.equal(over.difference_eur,"5.00");
assert.equal(reviewSourcingQuote({...base,item_eur:null}).ready_for_review,false);
assert.ok(reviewSourcingQuote({...base,inspection_eur:""}).missing.includes("inspection_eur"));
assert.ok(reviewSourcingQuote({...base,service_fee_eur:"-1"}).missing.includes("service_fee_eur"));
assert.ok(reviewSourcingQuote({...base,source_url:"javascript:alert(1)"}).missing.includes("source_url"));
assert.ok(reviewSourcingQuote({...base,currency:"GBP"}).missing.includes("currency_must_be_EUR"));
assert.ok(reviewSourcingQuote({...base,seller_of_record_confirmed:false}).missing.includes("seller_of_record_confirmation"));
const penny=reviewSourcingQuote({...base,item_eur:"0.1",seller_shipping_eur:"0.2",
  nonrecoverable_import_vat_eur:0,inspection_eur:0,outbound_shipping_eur:0,service_fee_eur:0,other_eur:0});
assert.equal(penny.all_in_eur,"0.30");
console.log("Pokebro landed-cost quote tests passed.");
