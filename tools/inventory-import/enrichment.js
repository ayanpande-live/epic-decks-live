// Epic Decks inventory enrichment — review-first, provider-neutral, no scraping or live publishing.
export const ENRICHMENT_VERSION="1.0";
const trim=v=>String(v??"").trim();
const asNumber=v=>v===""||v===null||v===undefined?null:(Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null);
export function graderOf(value){
 const s=trim(value).toLowerCase().replace(/[^a-z0-9]/g,"");
 if(s==="ace"||s==="acegrading")return "ace";
 if(s==="psa"||s==="professionalsportsauthenticator")return "psa";
 return "";
}
export function officialCertUrl(record){
 const grader=graderOf(record?.identity?.grader),cert=trim(record?.identity?.certificate);
 if(!grader||!(/^[0-9]{4,12}$/.test(cert)))return "";
 return grader==="ace"?"https://acegrading.com/cert/"+cert:"https://www.psacard.com/cert/"+cert+"/psa";
}
export function officialPopUrl(record){
 const grader=graderOf(record?.identity?.grader);
 return grader==="ace"?"https://acegrading.com/pop":grader==="psa"?"https://www.psacard.com/pop":"";
}
export function normalizeEvidence(input,record,date=new Date().toISOString()){
 const i=input||{},identity=record?.identity||{},expected=trim(identity.grade),reported=trim(i.official_grade);
 const status=["reviewed_match","needs_review","discrepancy"].includes(i.status)?i.status:"needs_review";
 if(status==="reviewed_match"&&(!reported||!trim(i.reviewed_by)))throw Error("Confirmed cert review requires the observed grade and reviewer.");
 const mismatch=!!(expected&&reported&&expected!==reported);
 const certUrl=officialCertUrl(record);
 if(!certUrl)throw Error("A valid ACE or PSA grader and numeric certificate are required.");
 const pop={
   as_of:trim(i.as_of),source_url:certUrl,provider:graderOf(identity.grader),
   grade_population:asNumber(i.grade_population),
   higher_population:asNumber(i.higher_population),
   total_population:asNumber(i.total_population),
   label_grade_population:asNumber(i.label_grade_population),
   label_type:trim(i.label_type)
 };
 const counts=["grade_population","higher_population","total_population","label_grade_population"];
 const hasPop=counts.some(k=>pop[k]!==null);
 if(hasPop && (!/^\d{4}-\d{2}-\d{2}$/.test(pop.as_of)||!Number.isFinite(Date.parse(pop.as_of))))throw Error("Population evidence requires a source observation date (YYYY-MM-DD).");
 if(hasPop&&status!=="reviewed_match")throw Error("Review certificate identity before recording confirmed population metrics.");
 if(pop.total_population!==null&&pop.grade_population!==null&&pop.total_population<pop.grade_population)throw Error("Total population cannot be lower than grade population.");
 return {
  certificate:{status:mismatch?"discrepancy":status,official_grade:reported,source_url:certUrl,checked_at:date,notes:trim(i.notes).slice(0,2000),reviewed_by:trim(i.reviewed_by).slice(0,80),method:"human_review_official_page",identity_mismatch:mismatch},
  population:hasPop?pop:null
 };
}
export function applyEvidence(record,input,date){
 if(!record||!record.identity)throw Error("Invalid inventory record.");
 const evidence=normalizeEvidence(input,record,date);
 const previous=record.enrichment||{};
 const warnings=(record.warnings||[]).filter(w=>!String(w).startsWith("Certificate discrepancy:"));
 if(evidence.certificate.identity_mismatch)warnings.push("Certificate discrepancy: official grade differs from inventory grade.");
 const history=[...(previous.population_history||[])];
 if(evidence.population){const key=p=>JSON.stringify([p.provider,p.source_url,p.as_of,p.grade_population,p.higher_population,p.label_grade_population,p.total_population,p.label_type]);
 if(!history.some(x=>key(x)===key(evidence.population)))history.push(evidence.population);}
 return {...record,warnings,enrichment:{...previous,...evidence,population_history:history,version:ENRICHMENT_VERSION,updated_at:date||new Date().toISOString()}};
}
export function attachPhoto(record,side,dataUrl,rights,source="user_upload",now=new Date().toISOString()){
 if(!["front","back"].includes(side))throw Error("Invalid image side");
 if(!["owned","licensed","internal_reference"].includes(rights))throw Error("Image usage rights must be specified");
 if(!/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(dataUrl))throw Error("Upload a JPEG image");
 const e=record.enrichment||{},media=e.media||{};
 return {...record,enrichment:{...e,media:{...media,[side]:{data_url:dataUrl,rights,source,added_at:now}},version:ENRICHMENT_VERSION,updated_at:now}};
}
export function coverage(records){
 const result={records:records.length,certifiable:0,reviewed:0,discrepancies:0,population:0,front:0,back:0};
 for(const r of records){
  if(officialCertUrl(r))result.certifiable++;
  if(r.enrichment?.certificate?.status==="reviewed_match")result.reviewed++;
  if(r.enrichment?.certificate?.status==="discrepancy")result.discrepancies++;
  if(r.enrichment?.population?.grade_population!==null&&r.enrichment?.population?.grade_population!==undefined)result.population++;
  if(r.enrichment?.media?.front?.data_url)result.front++;
  if(r.enrichment?.media?.back?.data_url)result.back++;
 }
 return result;
}
export function socialInsight(record){
 const e=record?.enrichment,p=e?.population,id=record?.identity||{};
 if(e?.certificate?.status!=="reviewed_match"||!p||p.grade_population===null||p.grade_population===undefined)return "";
 const grade=trim(e.certificate.official_grade)||trim(id.grade),provider=p.provider?.toUpperCase()||"Grading company";
 if(!grade)return "";
 const title=trim(id.title)||"this card";
 let result="As of "+p.as_of+", "+provider+" reported "+p.grade_population.toLocaleString("en-GB")+" graded copies at grade "+grade+" for "+title+".";
 if(p.higher_population!==null&&p.higher_population!==undefined)result+=" "+p.higher_population.toLocaleString("en-GB")+" were graded higher.";
 if(p.label_grade_population!==null&&p.label_grade_population!==undefined)result+=" "+p.label_grade_population.toLocaleString("en-GB")+" at that grade used the "+(p.label_type||"specified")+" label.";
 return result+" Source: "+p.source_url+" (counts may change; verify before publication).";
}
// Safe, selectively approved view for Project TC and marketing. Never include cost, raw rows or internal provenance.
export function approvedPublicPreview(record){
 const e=record?.enrichment||{},id=record.identity||{},photos={};
 for(const side of ["front","back"]){
   const p=e.media?.[side];
   if(p&&["owned","licensed"].includes(p.rights))photos[side]=p.data_url;
 }
 return {title:trim(id.title),grader:trim(id.grader),grade:trim(id.grade),certificate:trim(id.certificate),photos,
  certificate_review:e.certificate?.status==="reviewed_match"?"human_reviewed":"unconfirmed",
  population:e.certificate?.status==="reviewed_match"?e.population||null:null};
}
