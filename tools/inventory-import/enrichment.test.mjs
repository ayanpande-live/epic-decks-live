import test from "node:test";
import assert from "node:assert/strict";
import {graderOf,officialCertUrl,officialPopUrl,normalizeEvidence,applyEvidence,attachPhoto,coverage,socialInsight,approvedPublicPreview} from "./enrichment.js";
const fixture=()=>({identity:{title:"Charizard ex",grader:"ACE Grading",grade:"10",certificate:"160419"},commercial:{acquisition_cost:85,price:160},content:{image_urls:[]},raw:{purchase_cost:"85"},warnings:[]});
const verified={status:"reviewed_match",official_grade:"10",reviewed_by:"Tester",as_of:"2026-10-28",grade_population:13,label_grade_population:4,label_type:"Ace",notes:"Checked official ACE page"};
test("canonical ACE PSA grader aliases",()=>{assert.equal(graderOf("ACE Grading"),"ace");assert.equal(graderOf("PSA"),"psa");assert.equal(graderOf("Other"),"")});
test("only links to known graders and numeric certificates",()=>{
 assert.equal(officialCertUrl(fixture()),"https://acegrading.com/cert/160419");
 assert.equal(officialCertUrl({...fixture(),identity:{grader:"PSA",certificate:"28329627"}}),"https://www.psacard.com/cert/28329627/psa");
 assert.equal(officialCertUrl({...fixture(),identity:{grader:"PSA",certificate:"javascript:alert(1)"}}),"");
 assert.ok(officialPopUrl(fixture()).startsWith("https://"));
});
test("population is dated and distinguishes label count",()=>{
 const r=applyEvidence(fixture(),verified,"2026-10-28T10:00:00Z");
 assert.equal(r.enrichment.population.grade_population,13);
 assert.equal(r.enrichment.population.label_grade_population,4);
 assert.equal(r.enrichment.population.as_of,"2026-10-28");
 assert.equal(r.enrichment.certificate.status,"reviewed_match");
 assert.equal(r.commercial.acquisition_cost,85);
});
test("cannot record confirmed population without review or date",()=>{
 assert.throws(()=>normalizeEvidence({...verified,status:"needs_review"},fixture()));
 assert.throws(()=>normalizeEvidence({...verified,as_of:""},fixture()));
});
test("zero population counts are valid",()=>{
 const r=applyEvidence(fixture(),{...verified,grade_population:0,label_grade_population:0});
 assert.equal(r.enrichment.population.grade_population,0);
});
test("grade mismatch forces discrepancy and warning",()=>{
 const r=applyEvidence(fixture(),{...verified,official_grade:"9"});
 assert.equal(r.enrichment.certificate.status,"discrepancy");
 assert.equal(r.enrichment.certificate.identity_mismatch,true);
 assert.match(r.warnings.join(" "),/discrepancy/i);
 assert.equal(socialInsight(r),"");
});
test("totals cannot be smaller than grade population",()=>{
 assert.throws(()=>normalizeEvidence({...verified,total_population:12},fixture()),/Total population/);
});
test("photo rights exclude internal source scans from public preview",()=>{
 const photo="data:image/jpeg;base64,YWJj";
 const first=attachPhoto(fixture(),"front",photo,"internal_reference","provider_download_user_supplied");
 const second=attachPhoto(first,"back",photo,"owned");
 const pub=approvedPublicPreview(second);
 assert.equal(pub.photos.front,undefined);
 assert.equal(pub.photos.back,photo);
 assert.equal(pub.commercial,undefined);
 assert.equal(pub.raw,undefined);
});
test("unreviewed public view never claims verification or population",()=>{
 const pub=approvedPublicPreview(fixture());
 assert.equal(pub.certificate_review,"unconfirmed");
 assert.equal(pub.population,null);
});
test("social copy cites date and source and does not claim rarity",()=>{
 const r=applyEvidence(fixture(),verified);
 const s=socialInsight(r);
 assert.match(s,/As of 2026-10-28/);
 assert.match(s,/13 graded copies/);
 assert.match(s,/acegrading\.com\/cert/);
 assert.doesNotMatch(s,/rarest|pop 1|investment/i);
});
test("coverage summarizes present evidence",()=>{
 const r=applyEvidence(fixture(),verified);
 const c=coverage([fixture(),r]);
 assert.deepEqual({records:c.records,certifiable:c.certifiable,reviewed:c.reviewed,population:c.population},{records:2,certifiable:2,reviewed:1,population:1});
});
