import test from "node:test";
import assert from "node:assert/strict";
import {psaCertCandidate,psaImageCandidates,requestPSA,enrichPackage} from "./psa-adapter.mjs";
const response={IsValidRequest:true,ServerMessage:"Request successful",PSACert:{CertNumber:"28329627",CardGrade:"9",Subject:"Pikachu",CardNumber:"025",TotalPopulation:14,PopulationHigher:3}};
test("API certificate becomes a candidate, NOT a physically verified slab",()=>{
 const c=psaCertCandidate(response,"28329627","2026-10-28T00:00:00Z");
 assert.equal(c.status,"api_record_found");assert.equal(c.grade_population,14);assert.equal(c.higher_population,3);assert.equal(c.certificate,"28329627");
 assert.equal(c.reviewed,false);assert.equal(c.physically_authenticated,undefined);
});
test("invalid or conflicting PSA response not accepted",()=>{
 assert.equal(psaCertCandidate({...response,PSACert:{...response.PSACert,CertNumber:"11111111"}},"28329627").status,"mismatched_cert");
 assert.equal(psaCertCandidate({IsValidRequest:true,ServerMessage:"No data found"},"28329627").status,"not_found");
});
test("image response only stores reference URLs and internal rights",()=>{
 const c=psaImageCandidates([{ImageURL:"https://example.com/front.jpg",IsFrontImage:true},{ImageURL:"javascript:bad",IsFrontImage:false}]);
 assert.equal(c.length,1);assert.equal(c[0].rights,"internal_reference");assert.equal(c[0].side,"front");
});
test("official API request sends bearer privately, only declared endpoint",async()=>{
 let called="",bearer="";
 const fetcher=async(url,opts)=>{called=url;bearer=opts.headers.Authorization;return {ok:true,json:async()=>response};};
 const c=await requestPSA("28329627","test-token",{fetcher});
 assert.equal(c.status,"api_record_found");assert.equal(bearer,"bearer test-token");
 assert.match(called,/api\.psacard\.com\/publicapi\/cert\/GetByCertNumber\/28329627/);
});
test("batch retains confidential fields without auto confirming",async()=>{
 const data={records:[{identity:{grader:"PSA",certificate:"28329627",title:"Test"},commercial:{acquisition_cost:88},content:{image_urls:[]},warnings:[]},{identity:{grader:"ACE",certificate:"160419"},commercial:{acquisition_cost:70},content:{image_urls:[]}}]};
 const fetcher=async()=>({ok:true,json:async()=>response});
 const result=await enrichPackage(data,"test-token",{limit:10,delayMs:0,fetcher});
 assert.equal(result.statistics.processed,1);
 assert.equal(result.package.records[0].enrichment.provider_candidate.status,"api_record_found");
 assert.equal(result.package.records[0].enrichment.certificate,undefined);
 assert.equal(result.package.records[0].commercial.acquisition_cost,88);
 assert.equal(result.package.records[1].enrichment,undefined);
});
