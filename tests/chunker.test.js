// Run: node tests/chunker.test.js   (no dependencies)
"use strict";
const C = require("../js/chunker.js");
let fails = 0, passes = 0;
function ok(cond, what) {
  if (cond) passes++; else { fails++; console.log("FAIL  " + what); }
}

const LIMIT = 1800;
const header = "From: a friend\nWritten: 2026-11-11\nThese are suggestions for the writers' room, not canon.";

function allWithin(parts, what) {
  ok(parts.length > 0, what + ": at least one part");
  parts.forEach((p, i) => ok(p.length <= LIMIT, `${what}: part ${i + 1} is ${p.length} <= ${LIMIT}`));
  parts.forEach((p, i) => ok(p.startsWith(`**Under Two Moons · The Writer's Room · Part ${i + 1} of ${parts.length}**`), `${what}: part ${i + 1} numbered`));
}

// Pull a split answer back out of the parts and compare it with the original.
function rebuild(parts, q) {
  let text = "";
  for (const p of parts) {
    const marks = ["> " + q + C.CONT + "\n", "> " + q + "\n"];
    for (const m of marks) {
      const at = p.indexOf(m);
      if (at < 0) continue;
      let body = p.slice(at + m.length);
      const more = body.indexOf(C.MORE);
      if (more >= 0) body = body.slice(0, more);
      else {
        const next = body.search(/\n\n(> |__\*\*|\*\*)/);   // the next entry in the same part
        if (next >= 0) body = body.slice(0, next);
      }
      text += body;
      break;
    }
  }
  return text;
}

// 1. nothing to export
allWithin(C.discordParts([], header, LIMIT), "header only");

// 2. many short entries: never split an entry that fits
const many = [];
for (let s = 0; s < 6; s++) for (let i = 0; i < 25; i++)
  many.push({ section: "Area " + s, sub: i % 5 ? "" : "Yato", q: "Question " + i + "?", a: "An answer of moderate length, " + "words ".repeat(20 + (i % 7) * 9) });
const pm = C.discordParts(many, header, LIMIT);
allWithin(pm, "many entries");
ok(pm.every(p => !p.includes(C.MORE)), "short entries are never split");
many.forEach(e => ok(pm.some(p => p.includes("> " + e.q + "\n" + e.a.replace(/\s+$/, ""))), "entry kept whole: " + e.section + " " + e.q));

// 3. one very long answer with paragraphs and sentences
const para = "The platform lights flicker twice. Nobody looks up! Is that normal? It is, here. ";
const long = Array.from({ length: 9 }, (_, i) => para.repeat(6 + i) + "\n\n").join("") + "Last line.";
const pl = C.discordParts([{ section: "Scenes and Dialogue", sub: "Scene 1", q: "Write a few lines", a: long }], header, LIMIT);
allWithin(pl, "long answer");
ok(pl.length > 3, "long answer spans several parts");
ok(rebuild(pl, "Write a few lines") === long, "long answer: every character kept, in order");

// 4. no spaces at all, with emoji (surrogate pairs) everywhere
const dense = "🌙月".repeat(2500) + "x" + "🌕".repeat(900);
const pd = C.discordParts([{ section: "Wild Ideas", sub: "", q: "Idea", a: dense }], "", LIMIT);
allWithin(pd, "dense emoji");
ok(rebuild(pd, "Idea") === dense, "dense emoji: every character kept");
pd.forEach((p, i) => ok(!/[\ud800-\udbff](?![\udc00-\udfff])|(^|[^\ud800-\udbff])[\udc00-\udfff]/.test(p), `dense emoji: part ${i + 1} has no broken surrogate pair`));

// 5. a long answer between short ones: neighbours stay whole, order kept
const mix = [
  { section: "Lore", sub: "", q: "Before", a: "short" },
  { section: "Lore", sub: "", q: "Long one", a: "word ".repeat(1200) + "end" },
  { section: "Lore", sub: "", q: "After", a: "also short" }
];
const px = C.discordParts(mix, header, LIMIT);
allWithin(px, "mixed");
ok(rebuild(px, "Long one") === mix[1].a, "mixed: long answer kept");
const joined = px.join("\n");
ok(joined.indexOf("> Before\nshort") < joined.indexOf("> Long one") && joined.indexOf("> Long one") < joined.indexOf("> After\nalso short"), "mixed: order kept");

// 6. every part repeats its section (and sub) so it reads on its own
pm.forEach((p, i) => ok(/__\*\*AREA \d\*\*__/.test(p.split("\n").slice(2, 3).join("")) || i === 0, `part ${i + 1} opens with its section`));

// 7. the text document contains every answer verbatim
const doc = C.textDocument(mix, header);
ok(mix.every(e => doc.includes(e.a)), "text document has every answer verbatim");
ok(doc.startsWith(header), "text document starts with the header");

// 8. cutAt never splits a surrogate pair at the boundary
const s = "a".repeat(9) + "😀";   // the emoji sits at 9..10
ok(C.cutAt(s, 10) === 9, "cutAt steps back before a surrogate pair");

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
