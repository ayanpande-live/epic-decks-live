import assert from "node:assert/strict";
import {reconcileCandidates,compareRecords,exportReconciliation} from "./reconcile.js";
const record=(source,sku,grader="",certificate="",title="Charizard",grade="",cardNumber="")=>({
 source,source_file:source+".csv",source_account:"",source_id:source+"-"+sku,
 identity:{sku,grader,certificate,title,grade,card_number:cardNumber,item_type:"slab"},
 stock:{quantity:1},commercial:{price:100}
});
const a=record("shopify","ONE","PSA","123","Charizard", "10", "215");
const b=record("ebay","ONE","","","Charizard");
const c=record("whatnot","W-3","PSA","123","Charizard","10","215");
const d=record("cardmarket","DIFFERENT","ACE","456","Charizard","10","215");
let analysis=reconcileCandidates([a,b,c,d]);
assert.equal(analysis.total,2,"same title alone never matches");
assert.equal(analysis.counts.high,1,"same grader/cert is strong");
assert.equal(analysis.counts.medium,1,"same SKU is possible match");
assert.ok(analysis.candidates.every(x=>x.requires_review),"all matches remain review-only");
const conflict=record("ebay","ONE","CGC","999","Charizard","9","125");
assert.equal(compareRecords(a,conflict).confidence,"conflict");
assert.ok(compareRecords(a,conflict).conflicts.length>=2,"cert and grade conflicts are flagged");
const distinct=record("ebay","OTHER","PSA","987","Charizard","10","215");
assert.equal(compareRecords(a,distinct),null,"same card/grade never automatically identifies same physical slab");
const report=exportReconciliation([a,b,c,d],analysis);
assert.equal(report.candidates.length,2);
assert.ok(report.warning.includes("No records have been merged"));
console.log("Reconciliation safety tests passed.");
