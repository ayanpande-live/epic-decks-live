// My Epic Decks — deterministic, offline-first MVP domain logic.
// No provider APIs, payment processing, AI generation or remote storage.
export const FREE_NEW_CARDS_PER_MONTH=10;
export const MAX_COLLECTION=300;
export const FIELDS=["name","set","number","artist","feature","pose","language","variant","grader","grade","certificate","condition","quantity"];
export const DEMO_CARDS=Object.freeze(Array.from({length:12},(_,i)=>({
  id:"demo-"+String(i+1).padStart(3,"0"),name:[
    "Aurora Fox","Flame Guardian","Tidal Dancer","Night Bloom","Solar Comet","Moonlit Wanderer",
    "Crystal Finch","Thunder Scout","Forest Spirit","Starlit Dragon","Dusk Explorer","Radiant Bloom"
  ][i],
  set:"Elemental Storybook (fictional)",number:String(i+1).padStart(2,"0")+"/12",
  artist:["Studio North (fictional)","Studio Ember (fictional)","Studio Tide (fictional)","Studio Prism (fictional)"][i%4],
  feature:["Radiating halo","Crimson foil accents","Iridescent waves","Violet shadow detail","Golden starburst","Soft moonlit border","Prismatic reflection","Electric backdrop","Leaf-patterned frame","Comet trails","Twilight palette","Glittering petal accents"][i],
  pose:["Looking back over its shoulder","Facing forward with raised arms","Leaping over a wave","Resting beneath a flower","Pointing toward the sky","Walking into the distance","Hovering over a crystal","Standing ready","Curled beneath a tree","Flying toward the horizon","Exploring a misty path","Turning toward the light"][i],
  language:"English",variant:"Concept art",grader:"",grade:"",certificate:"",condition:"Not applicable",quantity:"1",
  source:"synthetic-demo",created_at:"",color:["#15b6e8","#f45d61","#63b7ec","#a979d7","#f4cc45","#7f8bd0","#74dad9","#ffd345","#5bc994","#be7fe9","#e27b91","#f4b7d9"][i]
})));
const clean=(x,n=160)=>String(x??"").replace(/[\x00-\x1f\x7f]/g," ").trim().slice(0,n);
const norm=x=>clean(x).toLocaleLowerCase("en").replace(/\s+/g," ");
export function monthKey(date=new Date()){const d=new Date(date);if(Number.isNaN(d.getTime()))throw new Error("Invalid date");return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
export function cardIdentity(card){
  const grader=norm(card.grader),cert=norm(card.certificate);
  if(grader&&cert)return "slab|"+grader+"|"+cert;
  return "printing|"+[card.name,card.set,card.number,card.language,card.variant,card.grader,card.grade].map(norm).join("|");
}
export function normalizeCard(raw={},source="manual"){
 const card={};
 for(const f of FIELDS)card[f]=clean(raw[f],f==="feature"||f==="pose"?240:150);
 card.source=source==="synthetic-demo"?"synthetic-demo":"user-provided-unverified";
 card.color=/^#[0-9a-fA-F]{6}$/.test(String(raw.color))?raw.color:"#2ab5e8";
 card.id=clean(raw.id,90)||cardIdentity(card);
 card.quantity=String(Math.max(1,Math.min(999,parseInt(card.quantity,10)||1)));
 return card;
}
export function createState(){return {version:1,cards:[],unlocked:{},sessions:[],proPreview:false,seenWelcome:false}}
export function safeState(raw){
 const s=createState();
 if(!raw||typeof raw!=="object"||raw.version!==1)return s;
 s.cards=Array.isArray(raw.cards)?raw.cards.slice(0,MAX_COLLECTION).map(c=>normalizeCard(c,c?.source)):[];
 s.unlocked=raw.unlocked&&typeof raw.unlocked==="object"&&!Array.isArray(raw.unlocked)?Object.fromEntries(Object.entries(raw.unlocked).filter(([key,value])=>key.length<400&&value&&typeof value==="object").map(([key,value])=>[key,{source:value.source,month:value.month,date:value.date}])):{};
 s.sessions=Array.isArray(raw.sessions)?raw.sessions.slice(-300):[];
 s.proPreview=raw.proPreview===true;s.seenWelcome=raw.seenWelcome===true;
 return s;
}
export function mergeCards(state,candidates){
 const next=safeState(state),existing=new Set(next.cards.map(cardIdentity)),added=[],duplicates=[],invalid=[];
 for(const raw of candidates){
  const card=normalizeCard(raw,raw?.source);
  if(!card.name){invalid.push("Missing card name");continue}
  const identity=cardIdentity(card);
  if(existing.has(identity)){duplicates.push(card.name);continue}
  if(next.cards.length>=MAX_COLLECTION){invalid.push("Prototype limit reached: 300 records");break}
  card.id=identity;
  next.cards.push(card);existing.add(identity);added.push(card.name);
 }
 return {state:next,added,duplicates,invalid};
}
export function monthlyFreeUsed(state,at=new Date()){
 const m=monthKey(at);
 return Object.values(state?.unlocked||{}).filter(v=>v?.source==="free"&&v?.month===m).length;
}
export function unlockCard(state,identity,at=new Date()){
 const next=safeState(state);
 if(!next.cards.find(c=>cardIdentity(c)===identity))return {state:next,result:"missing"};
 if(next.unlocked[identity])return {state:next,result:"already-unlocked"};
 const used=monthlyFreeUsed(next,at);
 if(!next.proPreview&&used>=FREE_NEW_CARDS_PER_MONTH)return {state:next,result:"quota-reached"};
 next.unlocked[identity]={source:next.proPreview?"pro-preview":"free",month:monthKey(at),date:new Date(at).toISOString()};
 return {state:next,result:"unlocked"};
}
export function cardFacts(card){
 const f=[];
 const add=(label,value,prompt)=>{if(clean(value))f.push({label,value:clean(value,240),question:prompt})};
 add("Card identity",card.name,"What is the card or character called?");
 add("Set / series",card.set,"Which set or series is listed?");
 add("Card number",card.number,"What's the card number?");
 add("Illustrator",card.artist,"Who is credited as the illustrator?");
 add("Visual feature",card.feature,"What special visual feature stands out?");
 add("Pose / stance",card.pose,"How would you describe the character's pose?");
 add("Variant",card.variant,"What card variant is this?");
 add("Language",card.language,"What language is the card?");
 if(card.grader&&card.grade)add("Grading label",card.grader+" "+card.grade,"What grading label is recorded?");
 add("Condition (user note)",card.condition,"What condition is recorded?");
 return f;
}
export function practiceSession(state,identity,remembered,at=new Date()){
 const next=safeState(state);
 if(!next.unlocked[identity])return {state:next,result:"locked"};
 next.sessions.push({id:identity,remembered:!!remembered,date:new Date(at).toISOString(),xp:remembered?12:4});
 next.sessions=next.sessions.slice(-300);
 return {state:next,result:"recorded",xp:remembered?12:4};
}
export function learningStats(state){
 const sessions=state?.sessions||[], xp=sessions.reduce((a,b)=>a+(Number(b.xp)||0),0);
 return {xp,completed:sessions.length,remembered:sessions.filter(x=>x.remembered).length,level:Math.floor(xp/80)+1,unlocked:Object.keys(state?.unlocked||{}).length};
}
export function pitchChecklist(card,answer){
 const text=norm(answer),words=clean(answer,3000).split(/\s+/).filter(Boolean).length;
 const conditions=[
  {label:"Name the card",ok:!!card.name&&text.includes(norm(card.name))},
  {label:"Mention the set",ok:!card.set||text.includes(norm(card.set))},
  {label:"Share a visual talking point",ok:!card.feature&&!card.pose||[card.feature,card.pose].some(x=>!!x&&text.includes(norm(x)))},
  {label:"Mention the illustrator if known",ok:!card.artist||text.includes(norm(card.artist))},
  {label:"Avoid an unsupported claim of perfect condition",ok:!/guaranteed perfect|guaranteed profit|will (double|triple) in value|only one in the world/i.test(answer)}
 ];
 const score=conditions.filter(x=>x.ok).length;
 return {score,total:conditions.length,checks:conditions,words,notes:[
  words<12?"Try a short, clear introduction of the card and one visual detail.":null,
  words>110?"Aim for a tighter 20–45 second explanation.":null,
  "This is a rules-based coverage check, not AI feedback. Verify card and grading facts before selling."
 ].filter(Boolean)};
}
function splitCSV(text,delimiter){
 const rows=[],row=[];let field="",quoted=false;
 const src=text.replace(/^\ufeff/,"");
 for(let i=0;i<src.length;i++){
  const ch=src[i],next=src[i+1];
  if(ch==='"'){if(quoted&&next==='"'){field+='"';i++}else quoted=!quoted;continue}
  if(ch===delimiter&&!quoted){row.push(field);field="";continue}
  if((ch==='\n'||ch==='\r')&&!quoted){
   if(ch==='\r'&&next==='\n')i++;
   row.push(field);field="";
   if(row.some(v=>v.trim()))rows.push([...row]);
   row.length=0;continue;
  }
  field+=ch;
 }
 if(quoted)throw new Error("CSV has an unclosed quoted field.");
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 return rows;
}
export function parseCSV(source){
 const text=String(source??"");
 if(text.length>1_000_000)throw new Error("CSV too large for this prototype (1 MB maximum).");
 const first=text.split(/\r?\n/,1)[0]||"";
 const sep=["\t",";",","].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
 const rows=splitCSV(text,sep);
 if(rows.length<2)throw new Error("A header row and at least one card row are required.");
 if(rows.length>501)throw new Error("Import at most 500 rows per file in this prototype.");
 const headers=rows[0].map(x=>clean(x,120));
 if(headers.length>80)throw new Error("Too many CSV columns.");
 return {headers,rows:rows.slice(1).filter(r=>r.some(v=>clean(v))).map(r=>headers.map((_,i)=>clean(r[i]??"",240)))};
}
const ALIASES={
 name:["name","card name","card","title","product name","pokemon name"],
 set:["set","set name","expansion","series"],
 number:["number","card number","collector number","card #","no.","number in set"],
 artist:["artist","illustrator","illustration artist"],
 feature:["feature","visual feature","special feature","art detail","artwork detail","special details"],
 pose:["pose","stance","visual note","pose / stance"],
 language:["language","lang"],
 variant:["variant","finish","foil","rarity","version"],
 grader:["grader","grading company"],
 grade:["grade","score"],
 certificate:["certificate","cert","cert number","certification number"],
 condition:["condition"],
 quantity:["quantity","qty","count"]
};
export function suggestMapping(headers){
 const mappings={};
 for(const f of FIELDS){
  const idx=headers.findIndex(h=>ALIASES[f]?.includes(norm(h)));
  mappings[f]=idx>=0?idx:-1;
 }
 return mappings;
}
export function mappedRecords(csv,mapping){
 return csv.rows.map(row=>{
  const o={};
  for(const f of FIELDS){const i=Number(mapping[f]);o[f]=Number.isInteger(i)&&i>=0&&i<csv.headers.length?row[i]:""}
  return o;
 });
}
