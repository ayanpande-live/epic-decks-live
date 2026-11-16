// Epic Decks public catalogue projection. No inventory writes, external calls or publishing.
// Input is a *private, already-reviewed* stock view; never point a public site at raw master data.
const txt=(x,n=180)=>typeof x==="string"?x.trim().slice(0,n):"";
const validTime=(s)=>typeof s==="string"&&/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s));
const link=(s)=>{
  if(typeof s!=="string")return null;
  const v=s.trim();
  if(/^\/(?!\/)[a-zA-Z0-9/_\-.%]*$/.test(v))return v;
  try {const u=new URL(v);return u.protocol==="https:"?u.toString():null;}catch{return null;}
};
const euros=(v)=>{
  if(typeof v!=="string"&&typeof v!=="number")return null;
  const s=String(v).trim();
  if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(s))return null;
  const cents=Math.round(Number(s)*100);
  return cents>0?cents:null;
};
const rights=new Set(["seller_owned_photo","licensed_provider_scan"]);
export function buildPublicCatalogue(rows,{asOf=new Date().toISOString(),freshHours=24}={}){
  if(!Array.isArray(rows))throw new TypeError("rows must be an array");
  if(!validTime(asOf)||!Number.isFinite(freshHours)||freshHours<=0)throw new TypeError("Invalid time window");
  const counts=new Map();
  for(const row of rows){
    if(row?.unit_key)counts.set(String(row.unit_key),(counts.get(String(row.unit_key))||0)+1);
  }
  const products=[],excluded=[];
  for(const row of rows){
    const id=txt(row?.public_id,80), reasons=[];
    if(row?.publication_approved!==true)reasons.push("not_approved");
    if(!id||!txt(row?.title))reasons.push("missing_public_identity");
    if(!row?.unit_key||counts.get(String(row.unit_key))!==1)reasons.push("unit_duplicate_or_unknown");
    if(row?.stock_status!=="available"||row?.reserved===true||row?.sold===true)reasons.push("not_sellable");
    if(row?.cross_channel_check!==true)reasons.push("channel_check_pending");
    const at=row?.availability_verified_at;
    if(!validTime(at)||Date.parse(at)>Date.parse(asOf)||
       Date.parse(asOf)-Date.parse(at)>freshHours*3600_000)reasons.push("stale_availability");
    if(!rights.has(row?.media_rights)||!link(row?.hero_image))reasons.push("image_rights_pending");
    const priceCents=euros(row?.approved_price_eur);
    if(priceCents===null)reasons.push("unapproved_price");
    if(reasons.length){excluded.push({public_id:id||null,reasons});continue;}
    // Explicit allowlist: do not spread the input; it may contain acquisition costs,
    // private certificates, customer details, supplier records or source metadata.
    const marketplace=link(row?.approved_marketplace_url);
    products.push(Object.freeze({
      id,title:txt(row.title,180),set:txt(row.set_name,90),
      grader:txt(row.grade_company,30),grade:txt(row.grade_value,20),
      language:txt(row.language,30),variant:txt(row.variant,80),
      image:link(row.hero_image),price_eur:(priceCents/100).toFixed(2),
      availability_checked_at:at,
      action:marketplace?"external_marketplace":"enquiry_only",
      marketplace_url:marketplace
    }));
  }
  return {products,excluded}; // Diagnostics stay private; never ship excluded data to browser.
}
