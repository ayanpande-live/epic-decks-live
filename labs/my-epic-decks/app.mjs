import {
 FREE_NEW_CARDS_PER_MONTH,DEMO_CARDS,FIELDS,createState,safeState,mergeCards,
 monthKey,monthlyFreeUsed,unlockCard,cardIdentity,cardFacts,practiceSession,
 learningStats,pitchChecklist,parseCSV,suggestMapping,mappedRecords
} from "./core.mjs";

const STORAGE="myepicdecks-collector-learning-prototype-v1";
const $=(s)=>document.querySelector(s);
const select=(s)=>Array.from(document.querySelectorAll(s));
let state=readState(),activeScreen="home",csvPreview=null,quizIdentity="",quizIndex=0,answerVisible=false;
let photoObjectUrl=null,toastTimer=null,questMode=false,questSteps=0,choiceResolved=false,discoveryIndex=0,discoveryAnswered=false;
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
 if(!["home","collection","discover","compare","career","learn","sell","plans"].includes(screen))return;
 activeScreen=screen;
 select(".screen").forEach(s=>s.hidden=s.id!==screen);
 select("[data-screen]").forEach(b=>{
  if(b.matches("button")){if(b.dataset.screen===screen)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")}
 });
 window.scrollTo({top:0,behavior:"auto"});
 if(screen==="discover")renderDiscovery();
 if(screen==="compare")renderCompare();
 if(screen==="career")renderCareer();
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

// Curated fictional teaching content. Explanations are general principles, not real card metadata.
// Real card metadata is grounded in linked publisher card records; scenarios are simulated.
// Real card identities with hypothetical, evidence-led collector scenarios.
const DISCOVERY_STORIES=[
 {
  "tag": "COLLECTOR'S EYE · CONDITION",
  "name": "Magikarp · 203/193",
  "image": "https://images.pokemontcg.io/sv2/203.png",
  "glyph": "✧",
  "glow": "#47bfe8",
  "source": "https://www.pokemon.com/uk/pokemon-tcg/pokemon-cards/series/sv02/203",
  "story": "You are considering a raw Magikarp Illustration Rare from Paldea Evolved, illustrated by Shinji Kanda. The seller has shared a sharp front photo, but the back and edges are not visible. This is a hypothetical purchase situation, not a live listing.",
  "question": "Before committing to this particular copy, which evidence would you request first?",
  "choices": [
   {
    "label": "Clear back, edge and corner photos under neutral lighting",
    "reason": "Most useful missing evidence. A beautiful front image tells you little about whitening, edge wear or back centering. Photos cannot reveal every flaw, but they materially improve a condition assessment.",
    "good": true
   },
   {
    "label": "Recent completed sales for similar-condition raw copies",
    "reason": "Essential for deciding whether the asking price is sensible. But you still cannot establish whether this specific card matches those comparables without better condition evidence.",
    "good": false
   },
   {
    "label": "A seller video tilting the front surface under light",
    "reason": "A strong follow-up for checking surface marks and print lines. It complements rather than replaces back and edge images.",
    "good": false
   }
  ],
  "insight": "CONDITION INTELLIGENCE · Condition is evidence about a specific physical copy. Start by identifying what you cannot see; compare prices only after assessing whether the copies are truly comparable."
 },
 {
  "tag": "COLLECTOR'S EYE · ARTWORK",
  "name": "Gardevoir ex · 245/198",
  "image": "https://images.pokemontcg.io/sv1/245.png",
  "glyph": "◇",
  "glow": "#a38de8",
  "source": "https://www.pokemon.com/uk/pokemon-tcg/pokemon-cards/series/sv01/245",
  "story": "Gardevoir ex 245/198 is a real Special Illustration Rare from Scarlet & Violet, illustrated by Jiro Sasumo. Instead of testing whether you memorized its set number, this challenge asks how you would understand the actual image.",
  "question": "You want to explain why this illustration resonates with a collector. What is the strongest starting point?",
  "choices": [
   {
    "label": "Point to specific visual details and describe how they guide your interpretation",
    "reason": "Best grounded starting point. Let the actual image support your reading; another collector may interpret it differently, and that is part of the conversation.",
    "good": true
   },
   {
    "label": "Ask the collector which character moments or artistic styles they connect with",
    "reason": "Also valuable, particularly in a conversation. It becomes stronger when paired with specific observations from the card rather than remaining generic.",
    "good": false
   },
   {
    "label": "Discuss how the illustration differs from conventional full-art presentation",
    "reason": "Useful for an experienced collector who knows other printings. But make the comparison concrete and avoid implying a particular interpretation is objectively correct.",
    "good": false
   }
  ],
  "insight": "ARTWORK INTELLIGENCE · A strong interpretation starts with observable details. Ask what the artist makes you notice, then distinguish your interpretation from a verified fact."
 },
 {
  "tag": "SELLER ACADEMY · BUYER FIT",
  "name": "Magikarp · Price objection",
  "image": "https://images.pokemontcg.io/sv2/203.png",
  "glyph": "✦",
  "glow": "#e17fbd",
  "source": "https://www.pokemon.com/uk/pokemon-tcg/pokemon-cards/series/sv02/203",
  "story": "A collector is considering your specific Magikarp 203/193. They like the artwork, but say the price feels high. This is a fictional sales conversation; we have not supplied a live asking price or comparable sales.",
  "question": "What would you do before deciding whether to offer a discount?",
  "choices": [
   {
    "label": "Ask what comparable copies they've seen and check condition-matched sold prices",
    "reason": "Best first step for a price objection. You can establish whether the gap reflects condition, timing or a genuinely different market expectation.",
    "good": true
   },
   {
    "label": "Explain what makes this specific copy attractive, using clear condition photos",
    "reason": "Useful if the buyer is uncertain about quality. It is less persuasive if the objection is strictly the market price, so first learn what they are comparing against.",
    "good": false
   },
   {
    "label": "Ask whether their budget is firm and offer a payment-free alternative",
    "reason": "Reasonable when the buyer is budget-constrained. It should not become pressure to spend more or a distraction from the original price question.",
    "good": false
   }
  ],
  "insight": "SELLER INTELLIGENCE · Diagnose the objection before responding. A price concern can mean different things: budget, comparables, condition uncertainty or lack of conviction."
 }
];
function renderDiscovery(){
 const d=DISCOVERY_STORIES[discoveryIndex];
 $("#discovery-counter").textContent="STORY "+String(discoveryIndex+1).padStart(2,"0")+" / "+String(DISCOVERY_STORIES.length).padStart(2,"0");
 $("#discovery-status").textContent=discoveryAnswered?"Insight unlocked":"Explore · Decide · Discover";
 $("#discovery-tag").textContent=d.tag;$("#discovery-name").textContent=d.name;
 $("#discovery-story").textContent=d.story;$("#discovery-question").textContent=d.question;
 const source=$("#discovery-source");source.href=d.source;source.textContent="Verify card details ↗";
 const art=$("#discovery-art");art.replaceChildren();art.style.setProperty("--discovery-glow",d.glow);if(d.image){const img=element("img","discovery-card-image");img.src=d.image;img.alt=d.name+" card image";img.loading="eager";img.addEventListener("error",()=>{art.replaceChildren(element("span","",d.glyph))},{once:true});art.append(img)}else art.textContent=d.glyph;
 const choices=$("#discovery-choices");choices.replaceChildren();
 d.choices.forEach((choice,i)=>{
  const button=element("button","discovery-choice",choice.label);button.type="button";
  if(discoveryAnswered){button.disabled=true;if(choice.good)button.classList.add("correct")}
  button.addEventListener("click",()=>{
   if(discoveryAnswered)return;
   discoveryAnswered=true;
   const feedback=$("#discovery-feedback");feedback.replaceChildren();
   feedback.append(element("strong","",choice.good?"Good judgment for this buyer.":"A reasonable approach — consider the priority."));
   feedback.append(element("p","",choice.reason));
   const insight=$("#discovery-insight");insight.textContent=d.insight;insight.hidden=false;
   $("#discovery-next").hidden=false;
   renderDiscovery();
  });
  choices.append(button);
 });
 if(!discoveryAnswered){$("#discovery-feedback").replaceChildren();$("#discovery-insight").hidden=true}
 $("#discovery-next").hidden=!discoveryAnswered;
 $("#discovery-next").textContent=discoveryIndex===DISCOVERY_STORIES.length-1?"Play again ↻":"Next discovery →";
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
function startQuickQuest(){go("discover");}
function startMemoryQuest(){
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


let careerStage=0,careerSelected=-1,careerPath=[];
const CAREER_STAGES=[
 {scene:"Two English unlimited vintage Pikachu cards, each graded ACE 10, are offered at €200. You have a fictional €500 budget. No verified sales or grading-population figures are available yet.",question:"You can investigate one source before contacting the seller. Where do you start?",options:[
 {title:"Recent sold transactions for the exact card and grade",feedback:"Good price anchor if transactions exist. Beware sparse ACE 10 sales, language/variant mismatches and outliers. A sale is not a promise of future resale."},
 {title:"ACE and PSA population distributions",feedback:"Useful scarcity context, but ACE and PSA grading pools differ. A low ACE 10 count can reflect low submission volume rather than high rarity."},
 {title:"Current EU listings for comparable slabs",feedback:"Useful to understand competing offers and availability. Asking prices are not completed sales, so they cannot establish realized value."}
 ]},
 {scene:"Your first investigation gives you a direction, not a definitive winner. You still have no verified figures in this demo. Both cards cost the same, but a €200 asking price alone tells you nothing about the quality of the deal.",question:"What information would most improve your confidence next?",options:[
 {title:"Verify exact variants, certs and front/back slab photos",feedback:"Strong diligence. Base Set has variants such as shadowless and 1st Edition; exact matching matters. A grade is not a substitute for checking the actual slab and cert."},
 {title:"Check how frequently condition-matched slabs actually sell",feedback:"A useful liquidity check. The median price of one sale is less informative than repeatable transactions over time."},
 {title:"Clarify your collecting goal: nostalgia, set completion or resale",feedback:"A valid choice: the best card for your collection may not be the one with the strongest market evidence. Your objective changes the decision."}
 ]},
 {scene:"You have now considered pricing, grading context and collecting intent. Some evidence is still missing. You are not obliged to buy either slab.",question:"What's your decision with incomplete evidence?",options:[
 {title:"Choose Base Set, conditional on checking its evidence",feedback:"A defensible preference if Base Set fits your collection, but this demo cannot establish that €200 is fair. Confirm the exact printing and condition first."},
 {title:"Choose Jungle, conditional on checking its evidence",feedback:"A defensible preference if Jungle fits your collection, but this demo cannot establish that €200 is fair. Confirm the exact printing and condition first."},
 {title:"Hold the €500 virtual budget until the evidence is sufficient",feedback:"Waiting is a legitimate collector decision. You avoid committing to an unsupported valuation, although you may miss a purchase opportunity."}
 ]}
];
function renderCareer(){
 const d=CAREER_STAGES[careerStage];$("#career-stage").textContent="STAGE "+String(careerStage+1).padStart(2,"0")+" / 03";
 $("#career-situation").textContent=d.scene;$("#career-question").textContent=d.question;
 const wrap=$("#career-options");wrap.replaceChildren();
 d.options.forEach((option,i)=>{
  const btn=element("button","career-choice",(i+1)+". "+option.title);btn.type="button";
  if(careerSelected!==-1){btn.disabled=true;if(careerSelected===i)btn.classList.add("chosen")}
  btn.addEventListener("click",()=>{if(careerSelected!==-1)return;careerSelected=i;careerPath[careerStage]=i;renderCareer()});wrap.append(btn);
 });
 const feedback=$("#career-feedback");feedback.replaceChildren();
 if(careerSelected!==-1){
  feedback.append(element("strong","",careerStage===2?"Decision reviewed":"Evidence perspective unlocked"));
  feedback.append(element("p","",d.options[careerSelected].feedback));
  if(careerStage===2)feedback.append(element("p","","Chapter complete. No fictional profit or unsupported card-price forecast was awarded. Your choices demonstrate how you approach evidence and uncertainty."));
 }
 $("#career-advance").hidden=careerSelected===-1;
 $("#career-advance").textContent=careerStage===2?"Play again ↻":"Next stage →";
}

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
 $("#career-restart").addEventListener("click",()=>{careerStage=0;careerSelected=-1;careerPath=[];renderCareer()});
 $("#career-advance").addEventListener("click",()=>{careerStage=(careerStage+1)%CAREER_STAGES.length;careerSelected=-1;if(careerStage===0)careerPath=[];renderCareer()});
 $("#cmp-analyze").addEventListener("click",compareAnalyze);
 $("#cmp-clear").addEventListener("click",()=>{if(!confirm("Clear saved comparison observations?"))return;try{localStorage.removeItem(COMPARE_KEY)}catch{};select("#compare-evidence input").forEach(n=>n.value="");$("#cmp-notes").value="";$("#cmp-a-price").value="200";$("#cmp-b-price").value="200";$("#cmp-goal").value="balanced";compareAnalyze()});
 $("#compare").addEventListener("change",compareSave);
 $("#discovery-reset").addEventListener("click",()=>{discoveryIndex=0;discoveryAnswered=false;renderDiscovery()});
 $("#discovery-next").addEventListener("click",()=>{discoveryIndex=(discoveryIndex+1)%DISCOVERY_STORIES.length;discoveryAnswered=false;renderDiscovery()});
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
