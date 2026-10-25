import assert from "node:assert/strict";
import {parseDelimited,normalizeRows,normalizeSlabDrafts,suggestedSource} from "./normalize.js";

const parsed=parseDelimited('Handle,Title,Variant SKU,Variant Price,Image Src\nchar,Charizard,ED-1,140,https://example.com/front.jpg\nchar,,,,https://example.com/back.jpg');
assert.equal(suggestedSource(parsed.headers),"shopify");
const products=normalizeRows(parsed.rows,parsed.headers,{source:"shopify",file:"sample.csv"});
assert.equal(products.length,1,"image-only rows must not create additional products");
assert.equal(products[0].content.image_urls.length,2,"keep all product images");
assert.equal(products[0].identity.sku,"ED-1");

const generic=parseDelimited('sku;title;grade_company;cert_number;quantity\nABC;Pikachu;PSA;123;1\nABC;Pikachu;PSA;123;1');
const normalized=normalizeRows(generic.rows,generic.headers,{source:"spreadsheet"});
assert.equal(normalized.length,2,"never silently merge");
assert.ok(normalized[1].warnings.some(x=>x.includes("Possible duplicate")),"flag duplicates");

const raw=normalizeRows([{item_type:"Single",item_title:"Celebi",grade_value:"NM",sku:"S1"}],
["item_type","item_title","grade_value","sku"],{source:"spreadsheet"});
assert.equal(raw[0].identity.condition,"NM");
assert.equal(raw[0].identity.grade,"");

const phone=normalizeSlabDrafts({drafts:[{id:"d1",fields:{card_name:"Mew",cert_number:"445566",grade_company:"ACE"},front_photo:"data:image/jpeg;base64,a"}]});
assert.equal(phone[0].identity.certificate,"445566");
assert.equal(phone[0].content.image_urls.length,1);

const quoted=parseDelimited('Title,Notes\n"Foo, bar","line one\nline two"');
assert.equal(quoted.rows[0].Title,"Foo, bar");
assert.equal(quoted.rows[0].Notes,"line one\nline two");

console.log("All 6 inventory normalization checks passed.");
