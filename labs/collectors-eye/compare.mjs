const $=s=>document.querySelector(s);const select=s=>Array.from(document.querySelectorAll(s));function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
const COMPARE_KEY="myepicdecks-compare-v1";
const COMPARE_FIELDS=[
 {key:"ace10",name:"ACE 10 population",help:"Count graded ACE 10 for the exact variant"},
 {key:"acetotal",name:"ACE total graded",help:"Denominator for ACE 10 gem rate"},
 {key:"psa10",name:"PSA 10 population",help:"Different grader; context only"},
 {key:"psatotal",name:"PSA total graded",help:"Denominator for PSA 10 gem rate"},
 {key:"sold",name:"Recent comparable sold (€)",help:"Median or representative sale for exact grade, not an asking price"},
 {key:"listings",name:"Active comparable listings",help:"Count of comparable offers, not transactions"}
];
function compareRead(){try{return JSON.parse(localStorage.getItem(COMPARE_KEY)||"{}")}catch{return {}}}
function compareSave(){try{const data={};select("#compare input,#compare select,#compare textarea").forEach(n=>data[n.id]=n.value);localStorage.setItem(COMPARE_KEY,JSON.stringify(data))}catch{}}
function renderCompare(){
 const parent=$("#compare-evidence");if(!parent.children.length){
  for(const field of COMPARE_FIELDS){
   const row=element("div","compare-evidence-row");const label=element("label","",field.name);label.title=field.help;row.append(label);
   for(const side of ["a","b"]){const inp=element("input");inp.type="number";inp.min="0";inp.step="any";inp.inputMode="decimal";inp.placeholder="—";inp.id="cmp-"+side+"-"+field.key;inp.setAttribute("aria-label",field.name+" "+(side==="a"?"Base Set":"Jungle"));row.append(inp)}parent.append(row)
  }
  const saved=compareRead();select("#compare input,#compare select,#compare textarea").forEach(n=>{if(Object.prototype.hasOwnProperty.call(saved,n.id))n.value=saved[n.id]});
 }
}
function compareAnalyze(){
 compareSave();
 const number=id=>{const v=$("#"+id).value.trim();return v===""?null:Number(v)};
 const pa=number("cmp-a-price"),pb=number("cmp-b-price");
 const result=$("#cmp-result");result.replaceChildren();
 result.append(element("strong","","03 / Decision briefing"));
 if(pa===null||pb===null||!Number.isFinite(pa)||!Number.isFinite(pb)||pa<0||pb<0){result.append(element("p","","Enter valid nonnegative asking prices for both cards."));return}
 const goal=$("#cmp-goal").value;
 const difference=pa-pb;
 result.append(element("p","",difference===0?"Both asking prices are equal. The deciding factors must come from evidence and your collecting objective.":(difference>0?"Base Set":"Jungle")+" costs €"+Math.abs(difference).toFixed(2)+" more before fees and shipping."));
 const metric=(side,key)=>number("cmp-"+side+"-"+key);
 const fmt=n=>n===null?"unknown":n.toLocaleString("en-NL",{maximumFractionDigits:2});
 let known=0;
 for(const key of ["ace10","acetotal","psa10","psatotal","sold","listings"])if(metric("a",key)!==null&&metric("b",key)!==null)known++;
 const note=element("p","",known+" of 6 evidence categories have values for both cards. Figures are user-entered and not independently verified.");result.append(note);
 for(const side of ["a","b"]){
  const total=metric(side,"acetotal"),gem=metric(side,"ace10");
  if(total!==null&&gem!==null){
   const valid=total>0&&gem>=0&&gem<=total;
   result.append(element("p","",side==="a"?"Base Set: ":"Jungle: "+(valid?"":"")));
   const p=result.lastElementChild;p.textContent=(side==="a"?"Base Set":"Jungle")+" ACE gem rate: "+(valid?(100*gem/total).toFixed(1)+"% ("+fmt(gem)+"/"+fmt(total)+")":"invalid population inputs");
  }
 }
 const priorities={balanced:"Check condition-matched sold prices, grading populations, liquidity and personal appeal together.",resale:"Prioritize completed sales frequency, comparable prices, fees and time-to-sell. Active listings alone cannot establish liquidity.",scarcity:"Compare ACE 10 counts AND total graded. PSA figures are context, not directly interchangeable with ACE.",personal:"Compare artwork, nostalgia, set significance and what each specific copy adds to your collection."};
 result.append(element("p","",priorities[goal]));
 const soldA=metric("a","sold"),soldB=metric("b","sold");
 if(soldA!==null&&soldB!==null&&soldA>0&&soldB>0){
  result.append(element("p","", "Asking / entered sold reference: Base "+(pa/soldA).toFixed(2)+"×; Jungle "+(pb/soldB).toFixed(2)+"×. These are illustrative ratios based on your inputs, not valuations."));
 }
 const missing=COMPARE_FIELDS.filter(f=>metric("a",f.key)===null||metric("b",f.key)===null).map(f=>f.name);
 if(missing.length)result.append(element("p","", "Still missing: "+missing.join(", ")+"."));
 result.append(element("p","", "No automatic winner: grade populations, observed sales and exact-variant matching require source verification. No current market prices are fetched."));
}


renderCompare();$("#cmp-analyze").addEventListener("click",compareAnalyze);$("#cmp-clear").addEventListener("click",()=>{if(!confirm("Clear saved comparison observations?"))return;localStorage.removeItem(COMPARE_KEY);select("#compare-evidence input").forEach(n=>n.value="");$("#cmp-notes").value="";$("#cmp-a-price").value="200";$("#cmp-b-price").value="200";$("#cmp-goal").value="balanced";compareAnalyze()});$("#compare").addEventListener("change",compareSave);