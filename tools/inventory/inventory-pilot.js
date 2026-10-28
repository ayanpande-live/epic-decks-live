"use strict";
const E=window.EpicInventory,$=id=>document.getElementById(id);
const KEY="epic-decks-inventory-pilot-v1";
const fresh=()=>({records:[],bundles:[],queue:[]});
let state=fresh(),writeP=Promise.resolve(),inventoryDbP;
function inventoryDb(){return inventoryDbP||(inventoryDbP=new Promise((yes,no)=>{const req=indexedDB.open(KEY,1);req.onupgradeneeded=()=>req.result.createObjectStore("state");req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error)}))}
async function loadState(){const d=await inventoryDb();return new Promise((yes,no)=>{const req=d.transaction("state").objectStore("state").get("main");req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error)})}
async function storeState(snapshot){const d=await inventoryDb();return new Promise((yes,no)=>{const tx=d.transaction("state","readwrite");tx.objectStore("state").put(snapshot,"main");tx.oncomplete=yes;tx.onerror=()=>no(tx.error)})}
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const money=n=>"€"+(Number(n)||0).toFixed(2);
function persist(){const snapshot=structuredClone(state);writeP=writeP.then(()=>storeState(snapshot)).catch(e=>message("Local save failed: "+e.message+" — export a backup."));render()}
function message(t){$("status").textContent=t}
function download(filename,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=node("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function change(id,patch){try{state=E.transition(state,id,patch);persist()}catch(e){message(e.message)}}
function field(label,value,handler,type="text"){const wrap=node("label",label),input=node("input");input.type=type;input.value=value??"";input.onchange=()=>handler(input.value);wrap.append(input);return wrap}
function select(label,options,value,handler){const wrap=node("label",label),sel=node("select");options.forEach(([v,t])=>{const opt=node("option",t);opt.value=v;sel.append(opt)});sel.value=value;sel.onchange=()=>handler(sel.value);wrap.append(sel);return wrap}
function render(){
 $("stats").replaceChildren(...[state.records.length+" slabs",state.records.filter(E.buyable).length+" buyable",state.records.filter(r=>r.strategy==="strategic_hold").length+" holds",state.records.filter(r=>r.stock==="sold").length+" sold",state.queue.filter(q=>q.status==="pending").length+" pending channel tasks"].map(t=>node("span",t)));
 const list=$("inventory");list.replaceChildren();
 const filter=$("filter").value;
 state.records.filter(r=>filter==="all"||filter==="available"&&r.stock==="available"||filter==="hold"&&r.strategy==="strategic_hold"||filter==="offer"&&r.strategy==="offer_only"||filter==="sold"&&r.stock==="sold").forEach(r=>{
  const item=node("article");item.className="item";const head=node("div");head.className="item-head";
  if(r.front_photo){const img=node("img");img.src=r.front_photo;img.alt="Slab front";head.append(img)}
  const controls=node("div");controls.className="grid";
  const title=node("strong",(r.fields.card_name||"Unknown")+" · "+(r.fields.grade_company||"")+" "+(r.fields.grade_value||""));title.style.gridColumn="1 / -1";controls.append(title);
  controls.append(select("Stock",[["available","Available"],["reserved","Reserved"],["sold","Sold"]],r.stock,v=>{if(v==="sold"&&!confirm("Mark this slab SOLD? Any linked marketplace listings must be removed manually until integrations are active."))return render();change(r.id,{stock:v})}));
  controls.append(select("Strategy",E.STRATEGIES.map(x=>[x,x.replaceAll("_"," ")]),r.strategy,v=>change(r.id,{strategy:v})));
  controls.append(field("Asking price (€)",r.price_eur,v=>change(r.id,{price_eur:Number(v)||0}),"number"));
  controls.append(field("Hold review date",r.hold_until||"",v=>change(r.id,{hold_until:v}),"date"));
  controls.append(field("Target price (€)",r.target_price_eur??"",v=>change(r.id,{target_price_eur:v===""?null:Number(v)}),"number"));
  const showcase=node("label","Show in catalogue "),ck=node("input");ck.type="checkbox";ck.checked=r.showcase;ck.onchange=()=>change(r.id,{showcase:ck.checked});showcase.append(ck);controls.append(showcase);
  for(const ch of E.CHANNELS)controls.append(field(ch+" listing ID",r.channels?.[ch]?.listing_id||"",v=>{const channels={...r.channels,[ch]:{listing_id:v.trim()}};change(r.id,{channels})}));
  head.append(controls);item.append(head);list.append(item);
 });
 const picks=$("bundle-picks");picks.replaceChildren();state.records.filter(E.buyable).forEach(r=>{const label=node("label"),ck=node("input");ck.type="checkbox";ck.value=r.id;ck.className="bundle-pick";label.append(ck,document.createTextNode(" "+(r.fields.card_name||r.id)+" · "+r.id.slice(0,8)));picks.append(label)});
 const bundles=$("bundles");bundles.replaceChildren();state.bundles.forEach(b=>{const item=node("div",b.name+" · "+b.ids.length+" slabs · "+money(b.price_eur)+" · "+(E.bundleAvailable(b,state.records)?"Available":"Unavailable"));item.className="queue";bundles.append(item)});
 const queue=$("queue");queue.replaceChildren();const pending=state.queue.filter(q=>q.status==="pending");if(!pending.length)queue.append(node("p","No pending reconciliation tasks."));
 pending.forEach(q=>{const item=node("div",q.channel+" · "+q.listing_id+" · "+q.reason+" · slab "+q.slab_id.slice(0,8));item.className="queue";const btn=node("button","I updated the marketplace");btn.onclick=()=>{if(!confirm("Have you actually removed or paused this external listing?"))return;state.queue=state.queue.map(x=>x.id===q.id?{...x,status:"confirmed",confirmed_at:new Date().toISOString()}:x);persist()};item.append(btn);queue.append(item)});
}
function db(){return new Promise((yes,no)=>{const req=indexedDB.open("epic-decks-slab-intake-v1",1);req.onupgradeneeded=()=>req.result.createObjectStore("drafts",{keyPath:"id"});req.onsuccess=()=>yes(req.result);req.onerror=()=>no(req.error)})}
$("load-drafts").onclick=async()=>{try{const d=await db(),drafts=await new Promise((yes,no)=>{const r=d.transaction("drafts").objectStore("drafts").getAll();r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});const before=state.records.length;state=E.importDrafts(state,drafts);persist();message("Imported "+(state.records.length-before)+" new approved drafts.")}catch(e){message("Import failed: "+e.message)}};
$("import-file").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text()),drafts=Array.isArray(data)?data:data.drafts;if(!Array.isArray(drafts))throw Error("Expected scanner JSON with a drafts array");const before=state.records.length;state=E.importDrafts(state,drafts);persist();message("Imported "+(state.records.length-before)+" new approved drafts.")}catch(err){message("Import failed: "+err.message)}e.target.value=""};
$("demo").onclick=()=>{const names=["Pikachu","Charizard","Blastoise"],drafts=names.map((name,i)=>({id:"demo-"+(i+1),human_reviewed:true,fields:{card_name:name,grade_company:"ACE",grade_value:"10",price_eur:String(70+i*30),purchase_cost_eur:String(35+i*20)}}));const before=state.records.length;state=E.importDrafts(state,drafts);persist();message("Loaded "+(state.records.length-before)+" demo slabs. Sample data is clearly marked with demo IDs.")};
$("add-bundle").onclick=()=>{const ids=[...document.querySelectorAll(".bundle-pick:checked")].map(x=>x.value);try{state=E.addBundle(state,{name:$("bundle-name").value.trim(),ids,price_eur:$("bundle-price").value});persist();message("Collection created. It will automatically become unavailable if a member slab is sold, held or reserved.")}catch(e){message(e.message)}};
$("catalogue").onclick=()=>download("epic-decks-public-catalogue-preview.json",E.catalogue(state.records,state.bundles));
$("backup").onclick=()=>download("epic-decks-private-inventory-backup.json",{exported_at:new Date().toISOString(),...state});
$("filter").onchange=render;render();loadState().then(saved=>{if(saved&&Array.isArray(saved.records)&&Array.isArray(saved.bundles)&&Array.isArray(saved.queue)){state=saved;render();message("Loaded saved inventory from this browser.")}}).catch(e=>message("Could not load saved inventory: "+e.message));