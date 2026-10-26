// Review-only candidate matches across independent imports.
// A match suggestion is not an inventory merge or confirmation of physical identity.
const clean=v=>String(v??"").trim().toLowerCase();
const compact=v=>clean(v).replace(/[^a-z0-9]+/g,"");
const grader=v=>{
  const s=compact(v);
  if(["bgs","beckett","beckettgrading","beckettgradingservices"].includes(s))return "bgs";
  if(["psa","professionalsportsauthenticator"].includes(s))return "psa";
  if(["cgc","cgccards"].includes(s))return "cgc";
  if(["ace","acegrading"].includes(s))return "ace";
  return s;
};
const meaningful=v=>{const s=compact(v);return s && !["none","unknown","na","n","tbd","uncertified"].includes(s)?s:""};
function recordKey(r){
  const id=r?.identity||{};
  return {
    sku:meaningful(id.sku),
    cert:meaningful(id.certificate),
    grader:grader(id.grader),
    grade:meaningful(id.grade),
    cardNumber:meaningful(id.card_number),
    language:meaningful(id.language),
    title:meaningful(id.title),
    set:meaningful(id.set_name),
    type:meaningful(id.item_type)
  };
}
export function compareRecords(first,second){
  const a=recordKey(first),b=recordKey(second),reasons=[],conflicts=[];
  const skuMatch=!!(a.sku && b.sku && a.sku===b.sku);
  const certMatch=!!(a.cert && b.cert && a.cert===b.cert && a.grader && b.grader && a.grader===b.grader);
  const srcMatch=!!(first.source_id&&second.source_id&&first.source===second.source&&first.source_account===second.source_account&&first.source_id===second.source_id);
  const uniqueSameRecord=first===second;
  if(uniqueSameRecord)return null;
  if(skuMatch)reasons.push("Matching seller SKU");
  if(certMatch)reasons.push("Matching grader + certificate");
  if(srcMatch)reasons.push("Matching source listing ID");
  if(!reasons.length)return null;
  if(a.cert && b.cert && a.grader && b.grader && ((a.cert!==b.cert)||(a.grader!==b.grader)))
    conflicts.push("Grading certificate or grader differs");
  if(a.grade && b.grade && a.grade!==b.grade)conflicts.push("Grade differs");
  if(a.cardNumber && b.cardNumber && a.cardNumber!==b.cardNumber)conflicts.push("Card number differs");
  if(a.language&&b.language&&a.language!==b.language)conflicts.push("Language differs");
  if(a.type&&b.type&&a.type!==b.type&&a.type!=="unclassified"&&b.type!=="unclassified")conflicts.push("Product category differs");
  const sameSource=first.source===second.source && first.source_file===second.source_file;
  const confidence=conflicts.length?"conflict":certMatch && skuMatch?"high":certMatch?"high":skuMatch?"medium":"source-record";
  if(sameSource)reasons.push("Same imported source; may be a duplicate row");
  return {confidence,reasons,conflicts,same_source:sameSource,requires_review:true};
}
export function reconcileCandidates(records,{limit=1000}={}){
  if(!Array.isArray(records))throw new TypeError("Expected inventory records");
  // Index strong identifiers instead of O(n²) pairwise comparison.
  const lookup=new Map(),found=new Map();
  records.forEach((r,i)=>{
    const k=recordKey(r);
    const keys=[];
    if(k.sku)keys.push("sku:"+k.sku);
    if(k.cert&&k.grader)keys.push("cert:"+k.grader+":"+k.cert);
    if(r.source_id)keys.push("listing:"+r.source+":"+r.source_account+":"+r.source_id);
    for(const key of keys){
      const previous=lookup.get(key)||[];
      for(const j of previous){
        const pairKey=j+"-"+i;
        if(!found.has(pairKey)){
          const assessment=compareRecords(records[j],r);
          if(assessment)found.set(pairKey,{left:j,right:i,...assessment});
        }
      }
      previous.push(i);lookup.set(key,previous);
    }
  });
  // When pairs share multiple keys, ensure all match reasons are assessed by compareRecords.
  const candidates=[...found.values()].sort((a,b)=>{
    const w={conflict:0,high:1,medium:2,"source-record":3};
    return w[a.confidence]-w[b.confidence]||a.left-b.left||a.right-b.right;
  });
  return {candidates:candidates.slice(0,limit),total:candidates.length,truncated:candidates.length>limit,
    counts:{conflict:candidates.filter(x=>x.confidence==="conflict").length,high:candidates.filter(x=>x.confidence==="high").length,medium:candidates.filter(x=>x.confidence==="medium").length}};
}
export function exportReconciliation(records,analysis){
  return {kind:"inventory-reconciliation-review",version:"1.0",generated_at:new Date().toISOString(),
    warning:"Candidate matches ONLY. No records have been merged. Quantity is never summed for matches.",
    candidates:analysis.candidates.map(c=>({
      left:{source:records[c.left].source,file:records[c.left].source_file,sku:records[c.left].identity.sku,certificate:records[c.left].identity.certificate,grader:records[c.left].identity.grader,listing_id:records[c.left].source_id,quantity:records[c.left].stock.quantity,price:records[c.left].commercial.price},
      right:{source:records[c.right].source,file:records[c.right].source_file,sku:records[c.right].identity.sku,certificate:records[c.right].identity.certificate,grader:records[c.right].identity.grader,listing_id:records[c.right].source_id,quantity:records[c.right].stock.quantity,price:records[c.right].commercial.price},
      assessment:{confidence:c.confidence,reasons:c.reasons,conflicts:c.conflicts,requires_review:true}
    }))};
}
