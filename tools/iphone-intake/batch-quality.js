"use strict";
const missingValue=v=>!String(v??"").trim()||/^(unknown|unidentified|n\/a|not applicable)$/i.test(String(v).trim());
function normalizeGrader(value){
 const raw=String(value||"").trim(),k=raw.toLowerCase().replace(/[^a-z0-9]/g,"");
 const map={ace:"ACE",acegrading:"ACE",psa:"PSA",professionalcardauthenticators:"PSA",
 beckett:"BGS",beckettgrading:"BGS",beckettgradingservices:"BGS",bgs:"BGS",
 cgc:"CGC",cgcgrading:"CGC",getgraded:"Get Graded",getgradeduk:"Get Graded",
 pg:"PG",pggrading:"PG",ags:"AGS"};
 return map[k]||raw;
}
function normalizeGrade(value){
 const raw=String(value||"").trim();
 const m=raw.match(/^(?:grade\s*)?(10|[1-9](?:\.\d)?)(?:\s*(?:gem\s*mint|mint|near\s*mint|nm|pristine|perfect))?$/i);
 return m?m[1]:raw;
}
function qualityIssues(r,i){
 const found=[];
 if(blocked(i))found.push("Invalid photo assignment");
 if(r.ai?.status==="error")found.push("AI request failed");
 else if(!r.ai)found.push("Not analyzed");
 if(missingValue(r.values.card_name))found.push("Card missing");
 if(missingValue(r.values.language))found.push("Language missing");
 if(missingValue(r.values.grade_company))found.push("Grader missing");
 if(missingValue(r.values.cert_number))found.push("Certificate missing");
 if(r.ai?.status==="possible_mismatch")found.push("Possible photo mismatch");
 return found;
}
function renderQuality(){
 const target=el("quality-rows");if(!target)return;
 target.replaceChildren();
 const mode=el("quality-filter").value;
 const counts={failed:0,missing:0,ready:0,review:0};
 rows.forEach((r,i)=>{
  const problems=qualityIssues(r,i);
  const failed=r.ai?.status==="error";
  const incomplete=problems.some(x=>x.endsWith("missing"));
  if(failed)counts.failed++;
  if(incomplete)counts.missing++;
  if(!problems.length)counts.ready++;else counts.review++;
  if(mode==="failed"&&!failed||mode==="missing"&&!incomplete||mode==="ready"&&problems.length||mode==="review"&&!problems.length)return;
  const item=node("div","quality-row");
  const name=node("div","quality-name",(i+1)+". "+(r.values.card_name||"Unidentified slab"));
  const meta=node("div","muted",[
   r.values.language||"Language ?",normalizeGrader(r.values.grade_company)||"Grader ?",
   normalizeGrade(r.values.grade_value)||"Grade ?",r.values.cert_number||"Cert ?"
  ].join(" · "));
  const warnings=node("div",problems.length?"warning muted":"ok muted",problems.length?problems.join(" · "):"No missing critical fields or flagged technical errors");
  const buttons=node("div","toolbar");
  const review=node("button","secondary","Review");review.type="button";
  review.onclick=()=>{
   const card=el("reviews").children[i];
   if(!card)return;
   const details=card.querySelector("details");if(details)details.open=true;
   card.scrollIntoView({behavior:"smooth",block:"start"});
  };
  buttons.append(review);
  if(failed){
   const retry=node("button","","Retry AI");retry.type="button";retry.disabled=busy||blocked(i);
   retry.onclick=()=>retryFailedSlab(i);buttons.append(retry);
  }
  item.append(name,meta,warnings,buttons);target.append(item);
 });
 el("quality-summary").textContent=rows.length+" slabs · "+counts.ready+" complete · "+counts.missing+" missing fields · "+counts.failed+" AI failures";
 el("retry-failed").disabled=busy||!counts.failed;
}
function classifyAIError(error,status){
 if(status===401||status===403)return {kind:"access",message:"Access code rejected",retryable:false};
 if(status===503)return {kind:"configuration",message:"AI service not configured",retryable:false};
 if(status===429)return {kind:"rate_limit",message:"AI rate limit",retryable:true};
 if(status===502||status===504||status===408)return {kind:"provider",message:"AI service temporarily unavailable",retryable:true};
 if(status===400||status===422)return {kind:"input",message:"Image or AI response could not be processed",retryable:false};
 return {kind:"network",message:error?.message||"Network request failed",retryable:true};
}
async function analyzeOne(i,token){
 const r=rows[i];
 const response=await fetch("/api/slab-analyze",{
  method:"POST",headers:{"Content-Type":"application/json","X-Intake-Token":token},
  body:JSON.stringify({front:photos[r.front].data,back:r.back>=0?photos[r.back].data:null})
 });
 let result={};try{result=await response.json()}catch{if(response.ok)throw Object.assign(new Error("Unreadable AI response"),{status:502})}
 if(!response.ok)throw Object.assign(new Error(result.error||"AI request failed"),{status:response.status});
 if(!result.fields||typeof result.fields!=="object")throw Object.assign(new Error("No extraction fields returned"),{status:502});
 const proposed={...blank(),...result.fields};
 for(const [key] of columns)if(missingValue(r.values[key])&&!missingValue(proposed[key]))r.values[key]=String(proposed[key]).trim();
 r.values.grade_company=normalizeGrader(r.values.grade_company);
 r.values.grade_value=normalizeGrade(r.values.grade_value);
 const pair=result.pair_review||{};
 r.ai={status:pair.status||"insufficient_evidence",reasons:Array.isArray(pair.reasons)?pair.reasons:[]};
 r.approved=false;r.saved=false;
 return r;
}
async function retryFailedSlab(i){
 if(busy||!rows[i]||rows[i].ai?.status!=="error"||blocked(i))return;
 const token=el("token").value.trim();
 if(!token){el("ai-status").textContent="Enter your AI access code to retry.";return}
 if(!confirm("Retry slab "+(i+1)+"? This makes one additional paid AI request."))return;
 busy=true;refresh();
 try{
  await analyzeOne(i,token);
  el("ai-status").textContent="Slab "+(i+1)+" reprocessed. Review extracted details before approval.";
 }catch(err){
  const info=classifyAIError(err,err.status);
  rows[i].ai={status:"error",kind:info.kind,retryable:info.retryable,reasons:[info.message]};
  el("ai-status").textContent="Retry failed: "+info.message;
 }finally{busy=false;refresh()}
}
el("retry-failed").onclick=async()=>{
 if(busy)return;
 const indices=rows.map((r,i)=>i).filter(i=>r.ai?.status==="error"&&!blocked(i));
 if(!indices.length)return;
 const token=el("token").value.trim();if(!token){el("ai-status").textContent="Enter your AI access code.";return}
 if(!confirm("Retry "+indices.length+" failed slabs? This makes up to "+indices.length+" additional paid AI requests."))return;
 busy=true;stop=false;el("stop").classList.remove("hidden");refresh();
 let done=0;
 try{
  for(const i of indices){
   if(stop)break;
   try{await analyzeOne(i,token);done++}
   catch(err){
    const info=classifyAIError(err,err.status);
    rows[i].ai={status:"error",kind:info.kind,retryable:info.retryable,reasons:[info.message]};
    if(!info.retryable)break;
   }
   reviewUI();renderQuality();
  }
  el("ai-status").textContent="Retried "+done+" successfully. Review the remaining exceptions.";
 }finally{busy=false;el("stop").classList.add("hidden");refresh()}
};
el("quality-filter").onchange=renderQuality;
renderQuality();