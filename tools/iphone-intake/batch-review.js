"use strict";
function renderBatchCards(){
 const host=el("batch-all-cards");host.replaceChildren();
 const issues=pairingProblems(batchPairs,batch.length);
 batchPairs.forEach((pair,i)=>{
  const card=document.createElement("article");card.className="panel";card.style.background="#0c2038";
  const title=document.createElement("h2");title.textContent="Slab "+(i+1)+(batchDraftIds[i]?" — Saved":"");
  card.append(title);
  const pics=document.createElement("div");pics.className="photo-grid";
  for(const idx of [pair.front,pair.back]){
   const frame=document.createElement("div");frame.className="photo";
   if(idx>=0&&batch[idx]){
    const pic=document.createElement("img");pic.src=batch[idx].data;
    pic.alt=(idx===pair.front?"Front":"Back")+" photo";frame.append(pic);
   }else frame.textContent="Back photo missing";
   pics.append(frame);
  }
  card.append(pics);
  const note=document.createElement("p");note.className="status";
  note.textContent=[...issues[i],pairReviews[i]?aiReviewStatus(i):"AI not run. Manual review required."].join(" ");
  card.append(note);
  const fields=document.createElement("div");fields.className="fields";
  const values=batchResults[i]||(batchResults[i]={});
  for(const [key,label] of schema){
   const wrap=document.createElement("label");wrap.className="field";
   wrap.textContent=label;
   const input=document.createElement("input");input.type="text";input.value=String(values[key]||"");
   input.oninput=()=>{values[key]=input.value;batchApprovals[i]=false;approval.checked=false};
   wrap.append(input);fields.append(wrap);
  }
  card.append(fields);
  const check=document.createElement("label");check.className="confirm-line";
  const approval=document.createElement("input");approval.type="checkbox";
  approval.checked=!!batchApprovals[i];
  approval.onchange=()=>batchApprovals[i]=approval.checked;
  const text=document.createElement("span");text.textContent="I reviewed these photos and card details, including any warnings.";
  check.append(approval,text);card.append(check);host.append(card);
 });
}
el("save-batch").onclick=async()=>{
 if(batchBusy||batchReviewBusy)return;
 const issues=pairingProblems(batchPairs,batch.length);
 const invalid=issues.some(row=>row.some(x=>/already assigned|also assigned|cannot be both|select a valid/i.test(x)));
 if(invalid){el("save-batch-status").textContent="Fix duplicate or invalid photo assignments first.";return}
 const selected=batchPairs.map((_,i)=>i).filter(i=>batchApprovals[i]&&String(batchResults[i]?.card_name||"").trim());
 if(!selected.length){el("save-batch-status").textContent="Approve at least one slab with a card name.";return}
 const button=el("save-batch");button.disabled=true;let saved=0;
 try{
  for(const i of selected){
   const pair=batchPairs[i],values={};
   for(const [key] of schema)values[key]=String(batchResults[i]?.[key]||"").trim();
   const id=batchDraftIds[i]||crypto.randomUUID();
   await save({id,created_at:new Date().toISOString(),status:"local-draft",
    fields:values,notes:"",front_photo:batch[pair.front].data,
    back_photo:pair.back>=0?batch[pair.back].data:"",
    batch_source:{pair_number:i+1},photo_pair_review:pairReviews[i]||{status:"not_checked"},
    human_reviewed:true,ai_verified:false,published:false});
   batchDraftIds[i]=id;saved++;
  }
  el("save-batch-status").textContent=saved+" approved slabs saved as private drafts. Nothing published. Export all JSON for backup.";
  renderBatchCards();renderBatchOverview();await refresh();
 }catch(err){el("save-batch-status").textContent=saved+" saved before error: "+err.message}
 finally{button.disabled=false}
};
