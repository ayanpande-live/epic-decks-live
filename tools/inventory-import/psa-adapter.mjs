// Optional PSA connector. Run only on a trusted local machine/server with a private PSA_API_TOKEN.
// No certificate result authenticates the physical slab. Image URLs are internal references, not licenses.
import fs from "node:fs/promises";
import path from "node:path";
const API="https://api.psacard.com/publicapi";
const clean=v=>String(v??"").trim();
const num=v=>v===null||v===undefined||v===""?null:(Number.isFinite(Number(v))?Number(v):null);
export function psaCertCandidate(input,cert,checkedAt=new Date().toISOString()){
 if(!input?.IsValidRequest || input?.ServerMessage!=="Request successful" || !input.PSACert)return {status:"not_found"};
 const p=input.PSACert;
 if(clean(p.CertNumber)&&clean(p.CertNumber)!==clean(cert))return {status:"mismatched_cert",reason:"PSA returned a different cert number"};
 return {status:"api_record_found",provider:"psa",certificate:clean(cert),source_url:"https://www.psacard.com/cert/"+cert+"/psa",
  fetched_at:checkedAt,official_grade:clean(p.CardGrade||p.GradeDescription),card_number:clean(p.CardNumber),
  title:clean(p.Subject),brand:clean(p.Brand),year:clean(p.YearIssued||p.Year),
  spec_id:clean(p.SpecID),grade_population:num(p.TotalPopulation),higher_population:num(p.PopulationHigher),
  warning:"PSA API data, not proof of the physical slab. Population field meaning must be checked against the source before publishing.",images:[]};
}
export function psaImageCandidates(input){
 if(!Array.isArray(input))return [];
 return input.filter(x=>x&&typeof x.ImageURL==="string"&&/^https:\/\//i.test(x.ImageURL)).map(x=>({
  side:x.IsFrontImage===true?"front":x.IsFrontImage===false?"back":"unknown",
  url:x.ImageURL,rights:"internal_reference",source:"psa_api_image_url_only"
 })).slice(0,4);
}
export async function requestPSA(cert,token,{withImages=false,fetcher=fetch}={}){
 if(!/^[0-9]{4,12}$/.test(clean(cert)))throw Error("Invalid PSA cert");
 if(!clean(token))throw Error("Missing PSA_API_TOKEN");
 const headers={Authorization:"bearer "+token};
 const call=async endpoint=>{
  const response=await fetcher(API+endpoint,{headers,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error("PSA returned HTTP "+response.status);
  return response.json();
 };
 const raw=await call("/cert/GetByCertNumber/"+cert);
 const candidate=psaCertCandidate(raw,cert);
 if(withImages&&candidate.status==="api_record_found"){
  try{candidate.images=psaImageCandidates(await call("/cert/GetImagesByCertNumber/"+cert));}
  catch(e){candidate.image_lookup_warning="No accessible image lookup: "+e.message;}
 }
 return candidate;
}
export async function enrichPackage(data,token,{limit=10,withImages=false,fetcher=fetch,delayMs=1000}={}){
 if(!Array.isArray(data?.records))throw Error("Expected a review JSON with records.");
 const records=data.records.map(r=>({...r,enrichment:r.enrichment?{...r.enrichment}:undefined}));
 let processed=0,failed=0;
 for(const r of records){
  if(processed>=limit)break;
  const grader=clean(r.identity?.grader).toLowerCase().replace(/\s/g,"");
  const cert=clean(r.identity?.certificate);
  if(grader!=="psa"&&!["professionalsportsauthenticator"].includes(grader))continue;
  if(!/^[0-9]{4,12}$/.test(cert)||r.enrichment?.provider_candidate?.status==="api_record_found")continue;
  try{
   const candidate=await requestPSA(cert,token,{withImages,fetcher});
   r.enrichment={...(r.enrichment||{}),provider_candidate:candidate};
   if(candidate.status!=="api_record_found")failed++;
  }catch(e){r.enrichment={...(r.enrichment||{}),provider_candidate:{status:"lookup_failed",reason:e.message}};failed++;}
  processed++;
  if(delayMs&&processed<limit)await new Promise(resolve=>setTimeout(resolve,delayMs));
 }
 return {package:{...data,kind:"inventory-enrichment-review",exported_at:new Date().toISOString(),records},
  statistics:{processed,failed,untouched:records.length-processed}};
}
async function main(){
 const [input,output,...args]=process.argv.slice(2);
 if(!input||!output)throw Error("Usage: PSA_API_TOKEN=... node psa-adapter.mjs INPUT-review.json OUTPUT-review.json [--limit=10] [--images]");
 const token=process.env.PSA_API_TOKEN;
 if(!token)throw Error("Set PSA_API_TOKEN in your local environment; never paste it into GitHub or the browser.");
 const limitarg=args.find(x=>x.startsWith("--limit=")),limit=limitarg?Number(limitarg.split("=")[1]):10;
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error("--limit must be between 1 and 100.");
 const data=JSON.parse(await fs.readFile(input,"utf8"));
 const result=await enrichPackage(data,token,{limit,withImages:args.includes("--images")});
 await fs.mkdir(path.dirname(path.resolve(output)),{recursive:true});
 await fs.writeFile(output,JSON.stringify(result.package,null,2),{flag:"wx",mode:0o600});
 console.log("Staged "+result.statistics.processed+" PSA lookups, "+result.statistics.failed+" unresolved. Saved private review output.");
 console.log("No photos were downloaded and no certificate was marked physically authenticated.");
}
if(import.meta.url===new URL("file://"+process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
