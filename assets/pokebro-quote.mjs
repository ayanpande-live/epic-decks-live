// Pokébro deterministic all-in sourcing quote. No payments, marketplace requests or AI claims.
// Explicit zeros are required for not-applicable cost lines; absent costs fail closed.
const FIELDS=["item_eur","seller_shipping_eur","import_duty_eur",
  "nonrecoverable_import_vat_eur","inspection_eur","outbound_shipping_eur",
  "service_fee_eur","other_eur"];
function cents(value){
  if(typeof value!=="number"&&typeof value!=="string")return null;
  const s=String(value).trim().replace(",",".");
  if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(s))return null;
  const [whole,fraction=""]=s.split(".");
  const total=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  return Number.isSafeInteger(total)?total:null;
}
const euro=(c)=>(c/100).toFixed(2);
function verifiedUrl(value){
  try{const u=new URL(value);return u.protocol==="https:"&&u.hostname.includes(".")?u.toString():null;}catch{return null;}
}
export function reviewSourcingQuote(raw={}){
  const missing=[];
  if(raw.currency!=="EUR")missing.push("currency_must_be_EUR");
  const values={};
  for(const field of FIELDS){
    values[field]=cents(raw[field]);
    if(values[field]===null)missing.push(field);
  }
  const budget=cents(raw.max_budget_eur);
  if(budget===null||budget===0)missing.push("max_budget_eur");
  if(!verifiedUrl(raw.source_url))missing.push("source_url");
  if(typeof raw.source_checked_at!=="string"||!/^\d{4}-\d\d-\d\dT/.test(raw.source_checked_at)
     ||!Number.isFinite(Date.parse(raw.source_checked_at)))missing.push("source_checked_at");
  if(raw.seller_of_record_confirmed!==true)missing.push("seller_of_record_confirmation");
  if(missing.length)return {ready_for_review:false,missing,all_in_eur:null,fits_budget:null};
  const allIn=FIELDS.reduce((sum,f)=>sum+values[f],0);
  return {
    ready_for_review:true,
    all_in_eur:euro(allIn),
    max_budget_eur:euro(budget),
    fits_budget:allIn<=budget,
    difference_eur:euro(Math.abs(budget-allIn)),
    difference_kind:allIn>budget?"over_budget":"remaining",
    cost_breakdown_eur:Object.fromEntries(FIELDS.map(f=>[f,euro(values[f])])),
    source_url:verifiedUrl(raw.source_url),
    source_checked_at:raw.source_checked_at,
    recommendation:"human_review_required",
    purchase_authorized:false,
    // This never implies the seller, actual stock, final VAT treatment, grade or resale value is verified.
  };
}
