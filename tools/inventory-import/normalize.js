// Epic Decks — universal inventory normalization (browser + Node).
// All imports are staged for review. No catalog mutation, API call, or automatic merge.
export const FIELDS = [
 ["title","Product title"],["sku","Internal SKU"],["item_type","Product type"],["description","Description"],
 ["grader","Grading company"],["grade","Grade"],["certificate","Certificate number"],
 ["set_name","Set"],["card_number","Card number"],["language","Language"],["year","Year"],["condition","Condition"],
 ["quantity","Available quantity"],["price","Selling price"],["currency","Currency"],["cost","Private acquisition cost"],
 ["image_url","Image URL"],["external_id","External item ID"],["listing_url","Listing URL"]
];
const ALIASES={
 title:["item_title","title","name","product name","item name","listing title","card name","article name"],
 sku:["sku","variant sku","seller sku","stock keeping unit"],
 item_type:["item_type","category","product category","product type","type"],
 description:["item_description","description","body (html)","body html","item description"],
 grader:["grade_company","grader","grading company","grading service"],
 grade:["grade_value","grade","grading grade","card grade"],
 certificate:["cert_number","certificate number","certification number","cert number","certification id","cert"],
 set_name:["set_name","set name","set","expansion"],
 card_number:["card_number","card number","collector number","card no","number"],
 language:["language","lang"],
 year:["year","release year"],
 condition:["condition","card condition"],
 quantity:["available_qty","available quantity","inventory quantity","variant inventory qty","quantity","stock","amount","qty"],
 price:["target_price","variant price","selling price","sale price","price","unit price"],
 currency:["currency","currency code"],
 cost:["purchase_price","purchase cost","cost per item","acquisition cost","buy price","cost"],
 image_url:["hero_image","image src","image url","photo url","image","images"],
 external_id:["idarticle","id_product","idproduct","listing id","item id","external id","article id","variant id","id","handle"],
 listing_url:["whatnot_listing_url","listing url","product url","url","link"]
};
const norm=x=>String(x??"").toLowerCase().replace(/^\ufeff/,"").replace(/[^a-z0-9]+/g," ").trim();
const clean=x=>String(x??"").trim();
export function suggestedSource(headers){
 const h=headers.map(norm);
 if(h.includes("handle") && (h.includes("variant sku")||h.includes("variant price")))return "shopify";
 if(h.includes("idarticle")||h.includes("idproduct"))return "cardmarket";
 if(h.includes("whatnot store")||h.includes("whatnot listing url"))return "whatnot";
 if(h.includes("grade company")||h.includes("cert number"))return "spreadsheet";
 return "spreadsheet";
}
export function suggestedMapping(headers){
 const result={};
 for(const [field] of FIELDS){
  const names=ALIASES[field].map(norm);
  const exact=headers.find(h=>names.includes(norm(h)));
  result[field]=exact||"";
 }
 return result;
}
export function parseDelimited(input){
 const content=String(input).replace(/^\ufeff/,"");
 const first=content.split(/\r?\n/).slice(0,3).join("\n");
 const score=d=>(first.match(new RegExp(d==="|"?"\\|":d==="\\t"?"\\t":d,"g"))||[]).length;
 const delimiter=[",",";","\t"].sort((a,b)=>score(b)-score(a))[0];
 const lines=[];let row=[],cell="",quoted=false;
 for(let i=0;i<content.length;i++){
  const ch=content[i];
  if(ch==='"'){
    if(quoted&&content[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
  }else if(!quoted&&ch===delimiter){row.push(cell);cell="";}
  else if(!quoted&&(ch==="\n"||ch==="\r")){
    if(ch==="\r"&&content[i+1]==="\n")i++;
    row.push(cell);if(row.some(v=>clean(v)))lines.push(row);
    row=[];cell="";
  }else cell+=ch;
 }
 if(quoted)throw new Error("CSV has an unmatched quotation mark");
 row.push(cell);if(row.some(v=>clean(v)))lines.push(row);
 if(!lines.length)throw new Error("The file contains no rows");
 const headers=lines.shift().map(clean);
 const rows=lines.map((cells,i)=>({__row:i+2,...Object.fromEntries(headers.map((h,j)=>[h,cells[j]??""]))}));
 return {headers,rows};
}
const amount=x=>{
 const s=clean(x).replace(/[€£$]/g,"").replace(/\s/g,"");
 if(!s)return "";
 const v=Number(s.replace(",","."));
 return Number.isFinite(v)&&v>=0?v:"";
};
const count=x=>{
 const v=Number(clean(x).replace(",","."));return Number.isSafeInteger(v)&&v>=0?v:"";
};
const typeOf=x=>{
 const s=norm(x);
 if(/slab|graded|psa|ace|bgs|cgc/.test(s))return "slab";
 if(/sealed|box|booster|etb|tin|pack/.test(s))return "sealed";
 if(/single|raw|card/.test(s))return "single";
 return "unclassified";
};
function mappedValue(row,mapping,key){
 const h=mapping[key];return h && Object.prototype.hasOwnProperty.call(row,h)?row[h]:"";
}
function toRecord(row,mapping,ctx){
 const get=f=>clean(mappedValue(row,mapping,f));
 const title=get("title"),sku=get("sku"),grader=get("grader"),cert=get("certificate");
 const issues=[];
 if(!title)issues.push("Missing product title");
 if(!sku && !cert)issues.push("Missing SKU/certificate for reliable identity");
 const rawQty=get("quantity"),rawPrice=get("price");
 const quantity=rawQty?count(rawQty):"";
 const price=rawPrice?amount(rawPrice):"";
 if(rawQty && quantity==="")issues.push("Quantity needs review");
 if(rawPrice && price==="")issues.push("Price needs review");
 if(typeOf(get("item_type")+" "+title)==="unclassified")issues.push("Check product category");
 const link=get("image_url");
 return {
  schema_version:"1.0",source:ctx.source,source_file:ctx.file,source_row:row.__row||null,
  source_account:ctx.account||"",source_id:get("external_id"),source_status:"imported_draft",review_status:"needs_review",
  identity:{sku,title,grader,grade:get("grade"),certificate:cert,set_name:get("set_name"),card_number:get("card_number"),language:get("language"),year:get("year"),condition:get("condition"),item_type:typeOf(get("item_type")+" "+title)},
  stock:{quantity},commercial:{price,currency:get("currency")||ctx.currency||"",acquisition_cost:amount(get("cost"))},
  content:{description:get("description"),image_urls:link?[link]:[],listing_url:get("listing_url")},
  warnings:issues,possible_duplicates:[],provenance:{source:ctx.source,file:ctx.file,row:row.__row||null},raw
 };
}
export function normalizeRows(rows,headers,config={}){
 if(!Array.isArray(rows)||!rows.length)return [];
 const source=config.source||suggestedSource(headers);
 const mapping={...suggestedMapping(headers),...(config.mapping||{})};
 const context={source,file:config.file||"",account:config.account||"",currency:config.currency||"EUR"};
 // Shopify image rows and variants require handle-aware grouping.
 if(source==="shopify"){
  const handleKey=headers.find(h=>norm(h)==="handle");
  const variantKey=headers.find(h=>norm(h)==="variant sku");
  const imageKey=headers.find(h=>norm(h)==="image src");
  if(handleKey){
    const groups=new Map();
    for(const row of rows){const handle=clean(row[handleKey]);if(!handle)continue;
      if(!groups.has(handle))groups.set(handle,[]);
      groups.get(handle).push(row);
    }
    const records=[];
    for(const [handle,group] of groups){
      const base=group.find(r=>clean(mappedValue(r,mapping,"title")))||group[0];
      const images=[...new Set(group.map(r=>clean(imageKey?r[imageKey]:"")).filter(Boolean))];
      // Repeated image-only rows should NOT create duplicate products.
      const productRows=group.filter((r,i)=>i===0 || clean(variantKey?r[variantKey]:"") || clean(mappedValue(r,mapping,"price")));
      const seenVariants=new Set();
      for(const row of productRows){
        const variant=clean(variantKey?row[variantKey]:"")||"default";
        if(seenVariants.has(variant))continue;
        seenVariants.add(variant);
        const enhanced={...base,...Object.fromEntries(Object.entries(row).filter(([,v])=>clean(v)!==""))};
        const rec=toRecord(enhanced,mapping,context);
        rec.source_id=handle+(variant!=="default"?"#"+variant:"");
        rec.content.image_urls=images;
        rec.provenance.handle=handle;
        records.push(rec);
      }
    }
    flagDuplicates(records);return records;
  }
 }
 const records=rows.map(row=>toRecord(row,mapping,context));
 flagDuplicates(records);return records;
}
function flagDuplicates(records){
 const seen=new Map();
 for(let i=0;i<records.length;i++){
  const r=records[i], keys=[];
  const sku=norm(r.identity.sku),cert=norm(r.identity.certificate),grader=norm(r.identity.grader);
  if(sku)keys.push("sku:"+sku);
  if(cert&&grader)keys.push("cert:"+grader+":"+cert);
  if(r.source_id)keys.push("src:"+r.source+":"+r.source_id);
  for(const key of keys){
    if(seen.has(key)){const j=seen.get(key);const other=records[j];const message="Possible duplicate with row "+(other.source_row||"?")+" ("+key+")";r.possible_duplicates.push(j);r.warnings.push(message);other.possible_duplicates.push(i);other.warnings.push("Possible duplicate with row "+(r.source_row||"?")+" ("+key+")");}
    else seen.set(key,i);
  }
 }
}
export function normalizeSlabDrafts(json,file="slab-drafts.json"){
 const drafts=Array.isArray(json)?json:Array.isArray(json?.drafts)?json.drafts:[];
 const rows=drafts.map((d,i)=>({__row:i+1,...(d.fields||{}),front_photo:d.front_photo||"",back_photo:d.back_photo||"",notes:d.notes||""}));
 const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];
 const mapping=suggestedMapping(headers);
 const records=normalizeRows(rows,headers,{source:"iphone",file,mapping});
 records.forEach((r,i)=>{
   const d=drafts[i]||{};
   r.content.image_urls=[d.front_photo,d.back_photo].filter(Boolean);
   r.content.description=clean(d.notes)||r.content.description;
   r.source_id=clean(d.id);
   r.provenance.original_draft_id=clean(d.id);
 });
 return records;
}
export function exportPackage(records,details={}){
 return {schema_version:"1.0",kind:"inventory-import-review",exported_at:new Date().toISOString(),publisher:"Epic Decks Inventory Intake Pilot",...details,records};
}
