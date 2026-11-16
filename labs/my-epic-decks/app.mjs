import {
 FREE_NEW_CARDS_PER_MONTH,DEMO_CARDS,FIELDS,createState,safeState,mergeCards,
 monthKey,monthlyFreeUsed,unlockCard,cardIdentity,cardFacts,practiceSession,
 learningStats,pitchChecklist,parseCSV,suggestMapping,mappedRecords
} from "./core.mjs";

const STORAGE="myepicdecks-collector-learning-prototype-v1";
const $=(s)=>document.querySelector(s);
const select=(s)=>Array.from(document.querySelectorAll(s));
let state=readState(),activeScreen="home",csvPreview=null,quizIdentity="",quizIndex=0,answerVisible=false;
let photoObjectUrl=null,toastTimer=null,questMode=false,questSteps=0,choiceResolved=false;
function readState(){
 try {const raw=localStorage.getItem(STORAGE);return raw?safeState(JSON.parse(raw)):createState()}
 catch {return createState()}
}
function persist(){
 try {localStorage.setItem(STORAGE,JSON.stringify(state));return true}
 catch {toast("Storage unavailable or full. Your changes may not survive a reload.");return false}
}
function toast(message){
 const el=$("#toast");el.textContent=message;el.hidden=false;
 if(toastTimer)clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{el.hidden=true},4800);
}
function element(tag,cls,text){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(text!==undefined)n.textContent=String(text);
 return n;
}
function cardByIdentity(id){return state.cards.find(c=>cardIdentity(c)===id)}
function stats(){
 const data=learningStats(state), used=monthlyFreeUsed(state);
 $("#stat-quota").textContent=used+" / "+FREE_NEW_CARDS_PER_MONTH;
 $("#quota-progress").style.width=Math.min(100,used/FREE_NEW_CARDS_PER_MONTH*100)+"%";
 $("#quota-caption").textContent=(state.proPreview?"PRO PREVIEW ACTIVE · ":"")+"10 new free unlocks per calendar month ("+monthKey()+")";
 $("#stat-level").textContent=String(data.level).padStart(2,"0");
 $("#stat-xp").textContent=data.xp+" XP earned";
 $("#stat-cards").textContent=String(state.cards.length);
 $("#stat-unlocked").textContent=data.unlocked+" unlocked lessons";
 $("#level-aside").textContent=String(data.level).padStart(2,"0");
 $("#rounds-aside").textContent=String(data.completed);
 $("#collection-count").textContent=state.cards.length+" card"+(state.cards.length===1?"":"s");
 $("#collection-quota").textContent=state.proPreview?"Pro preview: unlimited lesson tests":(FREE_NEW_CARDS_PER_MONTH-used)+" free unlocks left this month";
 $("#toggle-pro").textContent=state.proPreview?"Disable Pro preview":"Enable Pro preview (no payment)";
}
function go(screen){
 if(!["home","collection","learn","sell","plans"].includes(screen))return;
 activeScreen=screen;
 select(".screen").forEach(s=>s.hidden=s.id!==screen);
 select("[data-screen]").forEach(b=>{
  if(b.matches("button")){if(b.dataset.screen===screen)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")}
 });
 window.scrollTo({top:0,behavior:"auto"});
 if(screen==="learn")renderTraining();
 if(screen==="sell")renderSeller();
}
function renderCollection(){
 const list=$("#card-list");list.replaceChildren();
 if(!state.cards.length){
  const e=element("div","empty"),b=element("strong","", "Your collection starts here.");
  e.append(b,element("span","","Add a card manually, import a CSV, or load our 12 fictional demo cards."));
  list.append(e);return;
 }
 const isFull=monthlyFreeUsed(state)>=FREE_NEW_CARDS_PER_MONTH;
 for(const card of state.cards){
  const id=cardIdentity(card),unlocked=!!state.unlocked[id];
  const article=element("article","collection-card");
  const art=element("div","card-top");
  art.style.setProperty("--glow",card.color||"#2ab5e8");
  art.append(element("span","ribbon",card.source==="synthetic-demo"?"FICTIONAL DEMO":"YOUR CARD · UNVERIFIED"));
  art.append(element("span","sigil",card.source==="synthetic-demo"?"✦":"◇"));
  const info=element("div","card-info");
  info.append(element("h3","",card.name));
  info.append(element("p","",([card.set,card.number].filter(Boolean).join(" · ")||"Set and card number not provided")));
  const action=element("button","card-action "+(unlocked?"learn":isFull&&!state.proPreview?"pro":""),
    unlocked?"Practise again →":isFull&&!state.proPreview?"Free limit reached · View Pro":"Unlock this card ✦");
  action.type="button";
  action.addEventListener("click",()=>{
    if(unlocked){quizIdentity=id;quizIndex=0;answerVisible=false;questMode=false;go("learn");return}
    const done=unlockCard(state,id);
    if(done.result==="quota-reached"){toast("You've unlocked 10 new free cards this month. Old lessons still work.");go("plans");return}
    if(done.result!=="unlocked"){toast("Couldn't unlock this card: "+done.result);return}
    state=done.state;persist();renderAll();
    toast("Card unlocked! Choose Learn to practise with it.");
  });
  info.append(action);article.append(art,info);list.append(article);
 }
}
function unlockedCards(){return state.cards.filter(c=>!!state.unlocked[cardIdentity(c)])}
function fillSelect(el,cards,selected,placeholder){
 const old=selected||el.value;
 el.replaceChildren();
 if(!cards.length){const opt=element("option","",placeholder);opt.value="";el.append(opt);el.disabled=true;return ""}
 el.disabled=false;
 for(const card of cards){const option=element("option","",card.name+(card.number?" · "+card.number:""));option.value=cardIdentity(card);el.append(option)}
 el.value=cards.some(c=>cardIdentity(c)===old)?old:cardIdentity(cards[0]);
 return el.value;
}
function answerChoices(card,fact){
 const field=({ "Card identity":"name","Set / series":"set","Card number":"number","Illustrator":"artist","Visual feature":"feature","Pose / stance":"pose","Variant":"variant","Language":"language" })[fact.label];
 if(!field)return [];
 const pool=[...new Set(state.cards.filter(c=>c.source===card.source).map(c=>String(c[field]||"").trim()).filter(v=>v&&v!==fact.value))].slice(0,12);
 if(pool.length<2)return [];
 // Deterministic shuffle: avoids an unpredictable answer location on each rerender.
 const seed=quizIndex+card.name.length;
 const a=pool[seed%pool.length],b=pool[(seed+1)%pool.length];
 const arr=[fact.value,a,b];const offset=seed%3;
 return [...arr.slice(offset),...arr.slice(0,offset)];
}
function startQuickQuest(){
 if(!state.cards.length){const added=mergeCards(state,DEMO_CARDS);state=added.state;persist()}
 const card=state.cards.find(c=>!!state.unlocked[cardIdentity(c)])||state.cards[0];
 const id=cardIdentity(card);
 if(!state.unlocked[id]){
  const result=unlockCard(state,id);
  if(result.result==="quota-reached"){go("plans");toast("Your free monthly unlocks are used. Practise an unlocked card instead.");return}
  state=result.state;persist();
 }
 quizIdentity=id;quizIndex=0;answerVisible=false;choiceResolved=false;questMode=true;questSteps=0;renderAll();go("learn");
}
function renderTraining(){
 const available=unlockedCards();
 quizIdentity=fillSelect($("#learn-card"),available,quizIdentity,"Unlock a card to begin");
 const stage=$("#lesson-stage"),reveal=$("#reveal-fact"),remember=$("#remembered"),again=$("#review-again"),choices=$("#quiz-options"),feedback=$("#quest-feedback");
 choices.replaceChildren();feedback.replaceChildren();
 stage.replaceChildren();
 if(!available.length){
  stage.append(element("h3","","No cards unlocked yet."),element("p","","Start by unlocking one card from your collection. Demo cards don't require an account."));
  reveal.hidden=true;remember.hidden=true;again.hidden=true;$("#learn-fact-count").textContent="";$("#quest-step").textContent="NO LESSON YET";$("#quest-progress").style.width="0%";return;
 }
 const card=cardByIdentity(quizIdentity),facts=cardFacts(card);
 if(!facts.length){stage.append(element("p","","No supported facts in this record yet."));reveal.hidden=true;remember.hidden=true;again.hidden=true;return}
 quizIndex=((quizIndex%facts.length)+facts.length)%facts.length;
 const fact=facts[quizIndex];
 $("#quest-step").textContent=questMode?"QUICK QUEST · "+Math.min(3,questSteps+1)+" / 3":"FACT "+(quizIndex+1)+" / "+facts.length;
 $("#quest-progress").style.width=(questMode?Math.round(questSteps/3*100):Math.round(quizIndex/facts.length*100))+"%";
 const label=element("div","count","FACT "+(quizIndex+1)+" / "+facts.length+" · "+card.name);
 const title=element("h3","",fact.question);
 const subtitle=element("div","source",card.source==="synthetic-demo"?"FICTIONAL DEMO KNOWLEDGE":"YOUR OWN ENTRY · FACT NOT VERIFIED");
 stage.append(label,title,subtitle);
 if(answerVisible)stage.append(element("div","answer",fact.value));
 if(!answerVisible&&!choiceResolved){
  const options=answerChoices(card,fact);
  if(options.length>=3){
   const prompt=element("p","choice-hint","Choose the answer, or reveal it if you’re unsure.");choices.append(prompt);
   options.forEach(option=>{
    const button=element("button","quiz-choice",option);button.type="button";
    button.addEventListener("click",()=>{
     if(choiceResolved)return;choiceResolved=true;
     const correct=option===fact.value;
     choices.querySelectorAll("button").forEach(b=>{b.disabled=true;if(b.textContent===fact.value)b.classList.add("correct");if(b===button&&!correct)b.classList.add("incorrect")});
     feedback.textContent=correct?"Correct! You spotted the detail. Mark it remembered to earn XP.":"Not quite — the correct answer is highlighted. Mark it for another look.";
     answerVisible=true;stage.append(element("div","answer",fact.value));reveal.hidden=true;remember.hidden=!correct;again.hidden=correct;
    });choices.append(button);
   });
  }
 }
 reveal.hidden=answerVisible;remember.hidden=!answerVisible;again.hidden=!answerVisible;
 if(choiceResolved){remember.hidden=feedback.textContent.startsWith("Not quite");again.hidden=!remember.hidden;}
 $("#learn-fact-count").textContent=facts.length+" facts available";
}
function finishPractice(remembered){
 const done=practiceSession(state,quizIdentity,remembered);
 if(done.result!=="recorded"){toast("Unlock the card before practising.");return}
 state=done.state;persist();quizIndex++;answerVisible=false;choiceResolved=false;
 if(questMode){questSteps++;if(questSteps>=3){questMode=false;stats();renderTraining();toast("Quest complete! Three facts practised. Your XP is saved.");return}}
 stats();renderTraining();
 toast(remembered?"+12 XP · Nice recall!":"+4 XP · Keep practising!");
}
function renderSeller(){
 const available=unlockedCards(),old=$("#sell-card").value;
 fillSelect($("#sell-card"),available,old,"Unlock a card in the collection first");
 const c=cardByIdentity($("#sell-card").value),box=$("#seller-card-brief");
 box.replaceChildren();
 if(!c){box.textContent="Your first card lesson is waiting in the collection.";return}
 box.append(element("strong","",c.name),element("p","",([c.set,c.number,c.variant].filter(Boolean).join(" · ")||"Card details to be added")));
 const facts=cardFacts(c).filter(x=>["Illustrator","Visual feature","Pose / stance","Grading label","Condition (user note)"].includes(x.label));
 if(facts.length){
  const ul=element("ul");for(const f of facts)ul.append(element("li","",f.label+": "+f.value));
  box.append(ul);
 }
 box.append(element("small","","Input is "+(c.source==="synthetic-demo"?"fictional demo content.":"user-provided and not independently verified.")+" Avoid using unverified claims in actual listings."));
}
function renderAll(){stats();renderCollection();if(activeScreen==="learn")renderTraining();if(activeScreen==="sell")renderSeller()}
function handleDemo(){
 const added=mergeCards(state,DEMO_CARDS);
 state=added.state;persist();renderAll();go("collection");
 toast(added.added.length?added.added.length+" fictional cards added. Try unlocking 10!":"Demo cards are already in your library.");
}
function applyCardForm(ev){
 ev.preventDefault();
 const raw=Object.fromEntries(new FormData(ev.currentTarget).entries());
 delete raw.photo;
 const done=mergeCards(state,[raw]);
 if(done.added.length){
  state=done.state;persist();renderAll();ev.currentTarget.reset();
  if(photoObjectUrl)URL.revokeObjectURL(photoObjectUrl);photoObjectUrl=null;$("#photo-preview").hidden=true;
  toast("Added to your local collection. Choose Unlock to start learning.");
 }else toast(done.duplicates.length?"This printing or certificate is already in the collection.":"Please add a card name before saving.");
}
function showPhotoPreview(){
 const file=$("#photo").files[0];
 if(photoObjectUrl)URL.revokeObjectURL(photoObjectUrl);
 photoObjectUrl=null;$("#photo-preview").hidden=true;
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>6_000_000){toast("Choose a JPG, PNG or WebP smaller than 6 MB.");$("#photo").value="";return}
 photoObjectUrl=URL.createObjectURL(file);
 $("#photo-preview").src=photoObjectUrl;$("#photo-preview").hidden=false;
}
async function loadCSV(event){
 const file=event.currentTarget.files[0];if(!file)return;
 csvPreview=null;$("#mapping-area").hidden=true;
 try{
  if(file.size>1_000_000)throw new Error("Maximum file size is 1 MB");
  const input=await file.text(),parsed=parseCSV(input);
  csvPreview=parsed;
  const map=suggestMapping(parsed.headers),area=$("#mapping-fields");area.replaceChildren();
  for(const field of FIELDS){
   const label=element("label","",field.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase()));
   const selectEl=element("select");selectEl.dataset.field=field;
   const blank=element("option","","— Not provided —");blank.value="-1";selectEl.append(blank);
   parsed.headers.forEach((h,i)=>{const option=element("option","",h||"Column "+(i+1));option.value=String(i);selectEl.append(option)});
   selectEl.value=String(map[field]);label.append(selectEl);area.append(label);
  }
  $("#mapping-summary").textContent=parsed.rows.length+" row(s) detected. Match your fields below, especially Card Name. Only records with a name can be added.";
  $("#mapping-area").hidden=false;
  toast("CSV opened locally. Review the column mapping before importing.");
 }catch(e){toast("Couldn't read CSV: "+e.message)}
}
function importCSV(){
 if(!csvPreview)return;
 const mapping={};select("#mapping-fields select").forEach(el=>mapping[el.dataset.field]=Number(el.value));
 if(mapping.name<0){toast("Map a Card Name column before importing.");return}
 const records=mappedRecords(csvPreview,mapping);
 const result=mergeCards(state,records);
 if(!result.added.length){toast(result.invalid.length?result.invalid[0]:"No new cards; all rows already exist.");return}
 state=result.state;persist();renderAll();csvPreview=null;$("#mapping-area").hidden=true;$("#csv-file").value="";
 toast("Imported "+result.added.length+" cards · "+result.duplicates.length+" duplicates skipped · "+result.invalid.length+" rows skipped.");
}
function exportLocal(){
 const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),prototype:true,data:state},null,2)],{type:"application/json"});
 const href=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=href;a.download="my-epic-decks-private-local-export.json";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(href),2000);
 toast("Private JSON exported to your device. Store it securely.");
}
function resetLocal(){
 if(!confirm("Clear all locally saved cards, lessons and practice history from this browser? This cannot be undone unless you exported a backup."))return;
 state=createState();persist();quizIdentity="";quizIndex=0;answerVisible=false;
 $("#pitch").value="";$("#pitch-feedback").replaceChildren();
 renderAll();go("home");toast("Your browser's local prototype data was cleared.");
}
function evaluatePitch(){
 const c=cardByIdentity($("#sell-card").value),answer=$("#pitch").value;
 if(!c){toast("Unlock a card before trying Seller Studio.");return}
 if(!$("#seller-ack").checked){toast("Seller Studio is for adult/supervised evaluation only.");return}
 if(answer.trim().length<8){toast("Write a short description first.");return}
 const result=pitchChecklist(c,answer),place=$("#pitch-feedback");place.replaceChildren();
 place.append(element("h3","",result.score+" / "+result.total+" coverage checks met"));
 const ul=element("ul");
 for(const c of result.checks)ul.append(element("li",c.ok?"passed":"missed",(c.ok?"✓ ":"• ")+c.label));
 place.append(ul);for(const line of result.notes)place.append(element("p","",line));
}
function bind(){
 select("[data-screen]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();go(el.dataset.screen)}));
 select("[data-action]").forEach(el=>el.addEventListener("click",()=>{
  switch(el.dataset.action){case"load-demo":handleDemo();break;case"export":exportLocal();break;case"reset":resetLocal();break}
 }));
 $("#card-form").addEventListener("submit",applyCardForm);
 $("#photo").addEventListener("change",showPhotoPreview);
 $("#csv-file").addEventListener("change",loadCSV);
 $("#confirm-import").addEventListener("click",importCSV);
 $("#learn-card").addEventListener("change",e=>{quizIdentity=e.target.value;quizIndex=0;answerVisible=false;choiceResolved=false;questMode=false;renderTraining()});
 $("#reveal-fact").addEventListener("click",()=>{answerVisible=true;choiceResolved=false;renderTraining()});
 $("#quick-quest").addEventListener("click",startQuickQuest);
 $("#remembered").addEventListener("click",()=>finishPractice(true));
 $("#review-again").addEventListener("click",()=>finishPractice(false));
 $("#sell-card").addEventListener("change",renderSeller);
 $("#pitch").addEventListener("input",()=>{$("#word-count").textContent=($("#pitch").value.trim().match(/\S+/g)||[]).length+" words"});
 $("#check-pitch").addEventListener("click",evaluatePitch);
 $("#toggle-pro").addEventListener("click",()=>{
  state.proPreview=!state.proPreview;persist();renderAll();
  toast(state.proPreview?"Seller Pro preview enabled. No payment or entitlement created.":"Pro preview disabled. Previously unlocked lessons stay accessible.");
 });
 if("serviceWorker" in navigator&&location.protocol==="https:"){
  navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});
 }
}
bind();renderAll();go("home");
