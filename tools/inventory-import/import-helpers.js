// Small pure helpers for browser-only importer. No file content leaves the device.
const normalized=x=>String(x??"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const expected=new Set([
"sku","stock id provisional","card name","product title","item title","title","name",
"set code","set name","card number","language","grader","grading company",
"numeric grade","grade","certificate number","cert number","cardmarket listed qty",
"cardmarket ask unit eur","cardmarket condition","physical stock status","stock id",
"quantity","price","variant sku","variant price","handle","item number",
"custom label sku","listing site","grade company","current price figure","idarticle",
"whatnot store","whatnot listing url","product type","condition",
"inventory quantity","cardmarket ask unit","listed quantity","currency","image src"
]);
export function pickWorksheet(names){
 if(!Array.isArray(names)||!names.length)return "";
 const exact=["Inventory","Inventory_Master","Products","Product","Listings","Sheet1"];
 return exact.find(t=>names.includes(t))||names[0];
}
export function detectHeaderRow(matrix){
 if(!Array.isArray(matrix)||!matrix.length)return 0;
 const candidates=matrix.slice(0,30).map((row,index)=>{
   const strings=(Array.isArray(row)?row:[]).map(normalized).filter(Boolean);
   const hits=strings.filter(x=>expected.has(x)).length;
   const unique=new Set(strings).size;
   const score=hits*5 + (hits>=2?Math.min(strings.length,30):0) +
     (strings.length>=3&&unique===strings.length?2:0);
   return {index,score,hits};
 });
 const best=candidates.sort((a,b)=>b.score-a.score)[0];
 return best&&best.hits>=2?best.index:0;
}
export function exampleFor(rows,header){
 const values=rows.map(r=>String(r[header]??"").trim()).filter(Boolean).slice(0,2);
 return values.length?values.map(x=>x.length>35?x.slice(0,34)+"…":x).join(" · "):"No filled examples";
}
export function importKey(filename,worksheet=""){
 return normalized(filename)+"::"+normalized(worksheet);
}
export function upsertStagedGroup(groups,group){
 const index=groups.findIndex(x=>x.key===group.key);
 if(index<0)return {groups:[...groups,group],replaced:false};
 return {groups:groups.map((x,i)=>i===index?group:x),replaced:true};
}
