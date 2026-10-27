// Collector sourcing brief. Runs locally; does not submit or store customer data.
export const SOURCE_OPTIONS = ["Epic Decks", "eBay", "Cardmarket", "Approved partner", "Other permitted source"];
const clean = x => String(x ?? "").trim();
const oneLine = (x, length=220) => clean(x).replace(/[\r\n\t]+/g," ").slice(0,length);
const money = n => {
  const v = Number(String(n).replace(",","."));return Number.isFinite(v) && v>0 ? v : null;
};
export function normalizeRequest(input={}){
  const category=["slab","single","sealed","bundle","unsure"].includes(input.category)?input.category:"unsure";
  const shipping=["direct","checkpoint","compare"].includes(input.shipping)?input.shipping:"compare";
  return {
    version:"1.0",kind:"collector_sourcing_request",category,
    search_type:["exact","inspiration"].includes(input.search_type)?input.search_type:"exact",
    card:oneLine(input.card,180),set:oneLine(input.set,120),number:oneLine(input.number,60),
    language:oneLine(input.language,50),grader:oneLine(input.grader,60),grade:oneLine(input.grade,20),
    condition:oneLine(input.condition,60),max_budget_eur:money(input.budget),
    delivery_country:oneLine(input.delivery_country,80),shipping,
    reference_url:oneLine(input.reference_url,500),notes:oneLine(input.notes,600)
  };
}
export function validateRequest(r){
 const errors=[];
 if(!r.card || r.card.length<2)errors.push("Enter the card or product you're looking for.");
 if(!r.delivery_country)errors.push("Choose a delivery country.");
 if(!r.max_budget_eur)errors.push("Enter a valid all-in maximum budget greater than zero.");
 if(r.max_budget_eur && r.max_budget_eur>100000)errors.push("For requests above €100,000, contact us separately.");
 if(r.reference_url && !/^https:\/\/[^/\s]+\.[^/\s]+(?:[/?#]|$)/i.test(r.reference_url))
  errors.push("Use a full HTTPS link for an optional example listing.");
 if(r.notes.length>600)errors.push("Shorten the notes.");
 return errors;
}
export function requestSummary(r){
 const category={slab:"Graded slab",single:"Raw single",sealed:"Sealed product",bundle:"Collector bundle",unsure:"Please advise"}[r.category]||"Please advise";
 const delivery={direct:"Direct to buyer",checkpoint:"Via Epic Checkpoint (if available)",compare:"Compare direct & checkpoint"}[r.shipping]||"Compare routes";
 const lines=[
  "EPIC DECKS — COLLECTOR SOURCING REQUEST",
  "Product: "+r.card,
  "Category: "+category,
  r.set?"Set / era: "+r.set:null,r.number?"Card number: "+r.number:null,
  r.language?"Language: "+r.language:null,r.grader?"Grader: "+r.grader:null,r.grade?"Grade: "+r.grade:null,
  r.condition?"Condition: "+r.condition:null,
  "Maximum ALL-IN budget: €"+r.max_budget_eur.toFixed(2),
  "Delivery country: "+r.delivery_country,
  "Delivery preference: "+delivery,
  r.reference_url?"Example listing: "+r.reference_url:null,
  r.notes?"Additional details: "+r.notes:null,
  "",
  "Please propose source-backed options, actual item/availability checks, the full landed-cost breakdown, the agent/inspection fees (if any), who sells the item, and terms for returns or problems. No purchase is authorized by this request."
 ];
 return lines.filter(x=>x!==null).join("\n");
}
export function whatsappLink(phoneDigits, message){
 const phone=String(phoneDigits||"").trim();
 if(!/^[1-9]\d{7,14}$/.test(phone))return null;
 return "https://wa.me/"+phone+"?text="+encodeURIComponent(message);
}
export function emailLink(address,message){
 // Only a fixed, verified company address should be provided by callers.
 if(!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(address))return null;
 return "mailto:"+address+"?subject="+encodeURIComponent("Epic Decks — sourcing request")+"&body="+encodeURIComponent(message);
}
