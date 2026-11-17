import assert from "node:assert/strict";
import {
 FREE_NEW_CARDS_PER_MONTH,DEMO_CARDS,createState,monthKey,cardIdentity,
 mergeCards,unlockCard,monthlyFreeUsed,cardFacts,practiceSession,
 learningStats,pitchChecklist,parseCSV,suggestMapping,mappedRecords
} from "./core.mjs";

const now="2026-11-16T12:00:00Z", nextMonth="2026-12-01T10:00:00Z";
assert.equal(FREE_NEW_CARDS_PER_MONTH,10);
assert.equal(DEMO_CARDS.length,12);
assert.equal(monthKey(new Date(now)),"2026-11");
const loaded=mergeCards(createState(),DEMO_CARDS);
assert.equal(loaded.added.length,12);
assert.equal(loaded.state.cards.length,12);
assert.equal(loaded.duplicates.length,0);
const again=mergeCards(loaded.state,DEMO_CARDS);
assert.equal(again.added.length,0,"repeated upload cannot create duplicate records");
assert.equal(again.duplicates.length,12);
let state=loaded.state;
const ids=state.cards.map(cardIdentity);
for(const id of ids.slice(0,10)){
 const done=unlockCard(state,id,new Date(now));
 assert.equal(done.result,"unlocked");state=done.state;
}
assert.equal(monthlyFreeUsed(state,new Date(now)),10);
assert.equal(unlockCard(state,ids[0],new Date(now)).result,"already-unlocked","repeated unlock should not burn quota");
assert.equal(unlockCard(state,ids[10],new Date(now)).result,"quota-reached","11th free lesson must be blocked");
assert.equal(Object.keys(state.unlocked).length,10);
assert.equal(monthlyFreeUsed(state,new Date(nextMonth)),0,"free slots renew monthly, prior lessons persist");
const newMonth=unlockCard(state,ids[10],new Date(nextMonth));
assert.equal(newMonth.result,"unlocked");
assert.equal(monthlyFreeUsed(newMonth.state,new Date(nextMonth)),1);
let preview=structuredClone(state);preview.proPreview=true;
const pro=unlockCard(preview,ids[11],new Date(now));
assert.equal(pro.result,"unlocked");
assert.equal(pro.state.unlocked[ids[11]].source,"pro-preview");
assert.equal(monthlyFreeUsed(pro.state,new Date(now)),10,"pro preview shouldn't eat free quota");
const before=learningStats(state).xp;
const practised=practiceSession(state,ids[0],true,new Date(now));
assert.equal(practised.result,"recorded");
assert.equal(learningStats(practised.state).xp-before,12);
assert.equal(practiceSession(loaded.state,ids[1],false,new Date(now)).result,"locked");
const factual=cardFacts(state.cards[0]);
assert.ok(factual.some(f=>f.label==="Illustrator"));
assert.ok(factual.some(f=>f.label==="Visual feature"));
assert.ok(cardFacts({name:"User card",artist:"",feature:""}).every(x=>x.value),"no fabricated blank facts");
const pitch=pitchChecklist(state.cards[0],"Aurora Fox in Elemental Storybook (fictional), by Studio North (fictional). Radiating halo and clearly visible artwork.");
assert.ok(pitch.checks[0].ok);
assert.ok(pitch.score>=3);
const hype=pitchChecklist(state.cards[0],"Guaranteed profit: will double in value.");
assert.equal(hype.checks.at(-1).ok,false,"unsafe investment hype should be flagged");
const certA={name:"Sample",grader:"PSA",certificate:"10001",set:"Demo"};
const certB={...certA,certificate:"10002"};
assert.notEqual(cardIdentity(certA),cardIdentity(certB),"different physical certificates must be distinct");
const matched=mergeCards(createState(),[certA,certB]);
assert.equal(matched.added.length,2);

const csv=parseCSV('\ufeff"Card Name","Set","Card Number","Illustrator","Visual Feature"\n"Alpha, Star","Demo","1/20","Studio, One","Red, yellow foil"\n"Beta","Demo","2/20","",""');
assert.deepEqual(csv.headers,["Card Name","Set","Card Number","Illustrator","Visual Feature"]);
assert.equal(csv.rows.length,2);
assert.equal(csv.rows[0][0],"Alpha, Star");
const mapping=suggestMapping(csv.headers);
assert.equal(mapping.name,0);
assert.equal(mapping.number,2);
assert.equal(mapping.artist,3);
const records=mappedRecords(csv,mapping);
assert.equal(records[0].name,"Alpha, Star");
assert.equal(records[0].artist,"Studio, One");
assert.equal(records[0].feature,"Red, yellow foil");
const tsv=parseCSV("Card Name\tSet\nAlpha\tDemo\nBeta\tDemo");
assert.equal(tsv.rows.length,2);
const semi=parseCSV("Card Name;Set\nGamma;Demo");
assert.equal(semi.rows[0][0],"Gamma");
assert.throws(()=>parseCSV('name\n"unclosed'),/unclosed/);
assert.throws(()=>parseCSV("just a header"),/at least one/);
const unnamed=mergeCards(createState(),[{name:""}]);
assert.equal(unnamed.added.length,0);
assert.equal(unnamed.invalid.length,1);
console.log("My Epic Decks: 10-card quota, unlocks, monthly rollover, CSV mapping, duplicate safety, facts, XP and seller-coverage checks passed.");
