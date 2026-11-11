/*
  The Writer's Room: the page.

  No framework and no build step. Views are rebuilt from the config (config/*.js) and the
  contributor's drafts, which live in this browser's localStorage, one key per area, so
  each area's progress is kept on its own. Nothing is ever sent anywhere: the contributor
  copies the Discord parts or downloads the text file themselves.
*/
(function () {
  "use strict";

  var TOPICS = window.WR_TOPICS || [];
  var CHARS = (window.WR_CHARACTERS || []).concat(window.WR_NEW_CHARACTER ? [window.WR_NEW_CHARACTER] : []);
  var PREFIX = "u2m-writers-room:v1:";
  var LIMIT = 1800;

  // ------------------------------------------------------------ storage
  var storageOk = true;
  function load(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      storageOk = false;
      return fallback;
    }
  }
  function store(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      storageOk = false;
      return false;
    }
  }
  function removeAll() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { storageOk = false; }
  }

  function freshTopic(t) {
    if (t.mode === "characters") return { selected: [], newName: "", per: {}, pairs: [{ a: "", b: "", text: "" }], free: "", skipped: {} };
    if (t.mode === "scenes") return { scenes: [freshScene()], free: "" };
    if (t.mode === "wild") return { ideas: [{ kind: "", title: "", text: "" }] };
    return { choices: {}, answers: {}, skipped: {}, free: "" };
  }
  function freshScene() { return { prompt: "", ownPrompt: "", cast: [], setting: "", ownSetting: "", tone: "", text: "" }; }
  function freshPerson() { return { choices: {}, answers: {}, skipped: {} }; }

  var state = { meta: load("meta", { name: "" }), topics: {} };
  TOPICS.forEach(function (t) {
    var saved = load("topic:" + t.id, null);
    state.topics[t.id] = saved && typeof saved === "object" ? Object.assign(freshTopic(t), saved) : freshTopic(t);
  });

  var saveTimers = {};
  function saveTopic(id) {
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(function () {
      var ok = store("topic:" + id, state.topics[id]);
      showSaved(ok);
      updateCounts();
    }, 250);
  }
  function saveMeta() { showSaved(store("meta", state.meta)); }
  function showSaved(ok) {
    var el = document.getElementById("save-state");
    if (!el) return;
    if (!ok || !storageOk) {
      el.textContent = "This browser isn't letting the page keep drafts. Copy or download your answers before you close it.";
      return;
    }
    var t = new Date();
    el.textContent = "Saved in this browser at " + t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".";
  }

  // ------------------------------------------------------------ tiny DOM helper
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style") el.setAttribute("style", v);
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  function autosize(ta) {
    var fit = function () { ta.style.height = "auto"; ta.style.height = Math.max(ta.scrollHeight + 2, 0) + "px"; };
    ta.addEventListener("input", fit);
    requestAnimationFrame(fit);
  }
  function charById(id) { return CHARS.filter(function (c) { return c.id === id; })[0]; }
  function charName(id, st) {
    var c = charById(id);
    if (!c) return id;
    if (c.id === "new" && st && st.newName && st.newName.trim()) return st.newName.trim() + " (someone new)";
    return c.name;
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // ------------------------------------------------------------ question pieces
  // A quick pick. `bag` holds {sel: [...], other: "", otherOn: bool} under bag[choice.id].
  function choiceBlock(bag, choice, onChange, label) {
    var cur = bag[choice.id] || (bag[choice.id] = { sel: [], other: "", otherOn: false });
    var wrap = h("div", { class: "q" });
    var labelId = "c-" + Math.random().toString(36).slice(2);
    wrap.appendChild(h("div", { class: "q-row" }, h("span", { class: "q-label", id: labelId, text: label || choice.prompt })));
    if (choice.multi) wrap.appendChild(h("div", { class: "q-hint", text: "Pick as many as you like." }));
    var row = h("div", { class: "chips", role: "group", "aria-labelledby": labelId });
    var otherInput = h("input", { class: "field", type: "text", value: cur.other || "", "aria-label": (label || choice.prompt) + ": something else", placeholder: "Something else…" });
    var otherRow = h("div", { class: "other-row" }, otherInput);
    otherRow.hidden = !cur.otherOn;
    choice.options.forEach(function (opt) {
      var b = h("button", { type: "button", class: "chip", "aria-pressed": cur.sel.indexOf(opt) >= 0 ? "true" : "false", text: opt });
      b.addEventListener("click", function () {
        var i = cur.sel.indexOf(opt);
        if (i >= 0) cur.sel.splice(i, 1);
        else {
          if (!choice.multi) {
            cur.sel = [];
            row.querySelectorAll(".chip:not(.other)").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
            if (cur.otherOn) { cur.otherOn = false; otherRow.hidden = true; otherBtn.setAttribute("aria-pressed", "false"); }
          }
          cur.sel.push(opt);
        }
        b.setAttribute("aria-pressed", cur.sel.indexOf(opt) >= 0 ? "true" : "false");
        onChange();
      });
      row.appendChild(b);
    });
    var otherBtn = h("button", { type: "button", class: "chip other", "aria-pressed": cur.otherOn ? "true" : "false", text: "Something else" });
    if (choice.other !== false) {
      otherBtn.addEventListener("click", function () {
        cur.otherOn = !cur.otherOn;
        if (cur.otherOn && !choice.multi) {
          cur.sel = [];
          row.querySelectorAll(".chip:not(.other)").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        }
        otherBtn.setAttribute("aria-pressed", cur.otherOn ? "true" : "false");
        otherRow.hidden = !cur.otherOn;
        if (cur.otherOn) otherInput.focus();
        onChange();
      });
      row.appendChild(otherBtn);
    }
    otherInput.addEventListener("input", function () { cur.other = otherInput.value; onChange(); });
    wrap.appendChild(row);
    if (choice.other !== false) wrap.appendChild(otherRow);
    return wrap;
  }

  // An open question with a Skip toggle. Answers in bag.answers, skips in bag.skipped.
  function questionBlock(bag, q, onChange, opts) {
    opts = opts || {};
    bag.answers = bag.answers || {};
    bag.skipped = bag.skipped || {};
    var id = "q-" + Math.random().toString(36).slice(2);
    var wrap = h("div", { class: "q" + (bag.skipped[q.id] ? " skipped" : "") });
    var ta = h("textarea", { id: id, class: opts.big ? "big" : "", placeholder: opts.placeholder || "Write as much or as little as you like." });
    ta.value = bag.answers[q.id] || "";
    autosize(ta);
    ta.addEventListener("input", function () { bag.answers[q.id] = ta.value; onChange(); });
    var skip = h("button", { type: "button", class: "skip-btn" });
    var note = h("p", { class: "skipped-note", text: "Skipped. Nothing will be sent for this one." });
    var body = h("div");
    function paint() {
      var skipped = !!bag.skipped[q.id];
      wrap.classList.toggle("skipped", skipped);
      skip.textContent = skipped ? "Answer after all" : "Skip";
      skip.setAttribute("aria-label", (skipped ? "Answer after all: " : "Skip: ") + q.prompt);
      body.hidden = skipped;
      note.hidden = !skipped;
    }
    skip.addEventListener("click", function () {
      bag.skipped[q.id] = !bag.skipped[q.id];
      paint();
      onChange();
      if (!bag.skipped[q.id]) ta.focus();
    });
    wrap.appendChild(h("div", { class: "q-row" }, h("label", { class: "q-label", for: id, text: q.prompt }), opts.noSkip ? null : skip));
    if (q.hint) body.appendChild(h("p", { class: "q-hint", text: q.hint }));
    if (q.sparks && q.sparks.length) {
      body.appendChild(h("p", { class: "q-hint", text: "Sparks, if you want one (not confirmed places):" }));
      var sparks = h("div", { class: "chips" });
      q.sparks.forEach(function (s) {
        sparks.appendChild(h("button", { type: "button", class: "chip spark", onclick: function () {
          ta.value = (ta.value ? ta.value.replace(/\s+$/, "") + "\n\n" : "") + s + ": ";
          ta.dispatchEvent(new Event("input"));
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        } }, s));
      });
      body.appendChild(sparks);
    }
    body.appendChild(ta);
    wrap.appendChild(body);
    wrap.appendChild(note);
    paint();
    return wrap;
  }

  function freeBlock(bag, fw, onChange, key) {
    key = key || "free";
    var id = "f-" + Math.random().toString(36).slice(2);
    var ta = h("textarea", { id: id, class: "big", placeholder: "Anything goes, half-finished thoughts included." });
    ta.value = bag[key] || "";
    autosize(ta);
    ta.addEventListener("input", function () { bag[key] = ta.value; onChange(); });
    return h("section", { class: "block" }, h("h2", { text: "Free writing (optional)" }),
      h("div", { class: "q" }, h("label", { class: "q-label", for: id, text: fw.prompt }), ta));
  }

  var NOT_CANON = "Everything you write here is a suggestion for the writers' room. None of it becomes canon unless the team decides it should, and nothing on this page hints at what's coming.";

  // ------------------------------------------------------------ export model
  function trimA(s) { return String(s == null ? "" : s).replace(/^\s*\n/, "").replace(/\s+$/, ""); }
  function choiceText(c) {
    if (!c) return "";
    var parts = (c.sel || []).slice();
    if (c.otherOn && c.other && c.other.trim()) parts.push(c.other.trim());
    return parts.join("; ");
  }
  function bagEntries(section, sub, bag, choices, questions, out) {
    (choices || []).forEach(function (c) {
      var a = choiceText(bag.choices && bag.choices[c.id]);
      if (a) out.push({ section: section, sub: sub, q: c.prompt, a: a });
    });
    (questions || []).forEach(function (q) {
      if (bag.skipped && bag.skipped[q.id]) return;
      var a = trimA(bag.answers && bag.answers[q.id]);
      if (a) out.push({ section: section, sub: sub, q: q.prompt, a: a });
    });
  }
  function topicEntries(t) {
    var st = state.topics[t.id], out = [], sec = t.title;
    if (t.mode === "characters") {
      var pc = t.perCharacter || {};
      CHARS.forEach(function (c) {
        if (st.selected.indexOf(c.id) < 0) return;
        var bag = st.per[c.id] || freshPerson();
        if (c.id === "new" && st.newName && st.newName.trim()) out.push({ section: sec, sub: charName(c.id, st), q: "Their name", a: st.newName.trim() });
        bagEntries(sec, charName(c.id, st), bag, pc.choices, (pc.questions || []).concat(pc.more || []).concat(c.extra || []), out);
      });
      (st.pairs || []).forEach(function (p) {
        var text = trimA(p.text);
        if (!p.a && !p.b && !text) return;
        var who = [p.a ? charName(p.a, st) : "?", p.b ? charName(p.b, st) : "?"].join(" and ");
        out.push({ section: sec, sub: "Conversations", q: who, a: text || "(no notes yet)" });
      });
      var f = trimA(st.free);
      if (f) out.push({ section: sec, sub: "", q: t.freewrite.prompt, a: f });
    } else if (t.mode === "scenes") {
      var n = 0;
      st.scenes.forEach(function (s) {
        var prompt = s.prompt === "__own" ? trimA(s.ownPrompt) : s.prompt;
        var setting = s.setting === "__own" ? trimA(s.ownSetting) : s.setting;
        var cast = (s.cast || []).map(function (id) { return charName(id, state.topics.characters); }).join(", ");
        var text = trimA(s.text);
        if (!prompt && !setting && !cast && !s.tone && !text) return;
        n++;
        var sub = "Scene " + n;
        if (prompt) out.push({ section: sec, sub: sub, q: "Situation", a: prompt });
        if (cast) out.push({ section: sec, sub: sub, q: "Cast", a: cast });
        if (setting) out.push({ section: sec, sub: sub, q: "Setting", a: setting });
        if (s.tone) out.push({ section: sec, sub: sub, q: "Tone", a: s.tone });
        if (text) out.push({ section: sec, sub: sub, q: "The scene", a: text });
      });
      var fs = trimA(st.free);
      if (fs) out.push({ section: sec, sub: "", q: t.freewrite.prompt, a: fs });
    } else if (t.mode === "wild") {
      var k = 0;
      st.ideas.forEach(function (idea) {
        var text = trimA(idea.text), title = trimA(idea.title);
        if (!text && !title) return;
        k++;
        out.push({ section: sec, sub: "Idea " + k + (title ? ": " + title : ""), q: idea.kind || "Idea", a: text || "(just the title)" });
      });
    } else {
      bagEntries(sec, "", st, t.choices, (t.questions || []).concat(t.more || []), out);
      var fr = trimA(st.free);
      if (fr && t.freewrite) out.push({ section: sec, sub: "", q: t.freewrite.prompt, a: fr });
    }
    return out;
  }
  function allEntries() {
    var out = [];
    TOPICS.forEach(function (t) { out = out.concat(topicEntries(t)); });
    return out;
  }
  function exportHeader() {
    var name = (state.meta.name || "").trim() || "a guest";
    var d = new Date();
    var date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    return "From: " + name + "\nWritten: " + date + "\nThese are suggestions for the Under Two Moons writers' room. None of it is canon unless the team decides so.";
  }
  function updateCounts() {
    var n = allEntries().length;
    var el = document.getElementById("nav-count");
    if (el) el.textContent = n ? "(" + n + ")" : "";
  }

  // ------------------------------------------------------------ views
  var main = document.getElementById("main");

  function setView(el, title) {
    main.innerHTML = "";
    el.classList.add("view");
    main.appendChild(el);
    document.title = (title ? title + " · " : "") + "The Writer's Room · Under Two Moons";
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    var route = location.hash.split("/")[1] || "";
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === (route === "area" ? "areas" : route)) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    updateCounts();
  }

  function viewWelcome() {
    var started = allEntries().length > 0;
    var nameIn = h("input", { id: "who", type: "text", autocomplete: "nickname", value: state.meta.name || "", placeholder: "Leave it blank if you'd rather" });
    nameIn.addEventListener("input", function () { state.meta.name = nameIn.value; saveMeta(); });
    var root = h("div", null,
      h("section", { class: "hero", style: "background-image:url('assets/art/welcome.webp')" },
        h("div", { class: "wrap hero-inner" },
          h("p", { class: "eyebrow", text: "Under Two Moons" }),
          h("h1", { text: "The Writer's Room" }),
          h("div", { class: "rule" }),
          h("p", { class: "lede", text: "A quiet room for imagining Kurohama, the city under two moons, and the people who live there." })
        )
      ),
      h("article", { class: "letter" },
        h("h2", { text: started ? "Welcome back" : "An invitation" }),
        h("p", { text: "Thank you for coming in. There are no wrong answers here. This is a place to imagine the people of Under Two Moons, the city they live in, its stranger rules, and the scenes you'd like to see." }),
        h("p", { text: "There are six rooms. Take them in any order and skip whatever doesn't interest you; each one takes a few minutes, or longer if you get carried away." }),
        h("p", { text: "Everything you write is a suggestion. Some of it may find its way into the game, but none of it becomes canon automatically. Your drafts stay in this browser until you send them." }),
        h("p", { class: "sign", text: "Pull up a chair. The kettle's on." }),
        h("label", { for: "who", text: "What should we call you? (optional)" }),
        nameIn,
        h("div", { class: "actions" },
          h("a", { class: "btn btn-primary", href: "#/areas", text: started ? "Continue" : "Come in" }),
          started ? h("a", { class: "btn-quiet btn", href: "#/review", text: "Review what you've written" }) : null
        )
      )
    );
    setView(root, "");
  }

  function topicCount(t) { return topicEntries(t).length; }

  function viewAreas() {
    var cards = h("div", { class: "cards" });
    TOPICS.forEach(function (t) {
      var n = topicCount(t);
      cards.appendChild(h("a", { class: "card", href: "#/area/" + t.id },
        h("div", { class: "card-art", style: "background-image:url('" + t.card + "')" },
          h("img", { class: "card-ink", src: t.ink, alt: "" })),
        h("div", { class: "card-body" },
          h("p", { class: "eyebrow", text: t.kicker }),
          h("h2", { text: t.title }),
          h("p", { class: "soft", text: t.intro[0] }),
          h("div", { class: "meta" },
            h("span", { text: t.minutes }),
            h("span", { class: "progress-dot" + (n ? " started" : ""), text: n ? plural(n, "note", "notes") : "Not started" }))
        )));
    });
    setView(h("div", { class: "wrap" },
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow", text: "Six rooms" }),
        h("h1", { text: "Where would you like to start?" }),
        h("div", { class: "rule" }),
        h("p", { class: "lede soft", text: "Start anywhere. Each room saves your answers separately, so you can leave one half finished and come back to it." })),
      cards,
      h("div", { class: "cards-foot" },
        h("a", { class: "btn btn-primary", href: "#/review", text: "Review & send" }),
        h("span", { class: "soft", text: "You can send part of it now and come back for more later." }))
    ), "Areas");
  }

  function topicShell(t, content) {
    var i = TOPICS.indexOf(t);
    var next = TOPICS[i + 1];
    return h("div", null,
      h("section", { class: "banner", style: "background-image:url('" + t.art + "')" },
        h("div", { class: "narrow" },
          h("p", { class: "eyebrow", text: t.kicker }),
          h("h1", { text: t.title }),
          h("div", { class: "rule" }),
          h("div", { class: "intro" }, t.intro.map(function (p) { return h("p", { text: p }); })),
          h("p", { class: "minutes", text: t.minutes }))),
      h("div", { class: "narrow" },
        h("p", { class: "notice", role: "note", text: NOT_CANON }),
        content,
        h("nav", { class: "topic-foot", "aria-label": "Next steps" },
          h("a", { class: "btn", href: "#/areas", text: "All rooms" }),
          next ? h("a", { class: "btn", href: "#/area/" + next.id, text: "Next: " + next.title }) : null,
          h("a", { class: "btn btn-primary", href: "#/review", text: "Review & send" })))
    );
  }

  function viewStandard(t) {
    var st = state.topics[t.id];
    var save = function () { saveTopic(t.id); };
    var content = h("div", null,
      t.choices && t.choices.length ? h("section", { class: "block" }, h("h2", { text: "Quick picks" }),
        t.choices.map(function (c) { return choiceBlock(st.choices, c, save); })) : null,
      h("section", { class: "block" }, h("h2", { text: "A few questions" }),
        t.questions.map(function (q) { return questionBlock(st, q, save); })),
      t.more && t.more.length ? h("details", { class: "more block" },
        h("summary", { text: "More questions, if you're in the mood" }),
        t.more.map(function (q) { return questionBlock(st, q, save); })) : null,
      t.freewrite ? freeBlock(st, t.freewrite, save) : null
    );
    setView(topicShell(t, content), t.title);
  }

  function viewCharacters(t) {
    var st = state.topics[t.id];
    var save = function () { saveTopic(t.id); };
    var people = h("div");
    var pairs = h("div");

    function paintPeople() {
      people.innerHTML = "";
      var pc = t.perCharacter;
      CHARS.forEach(function (c) {
        if (st.selected.indexOf(c.id) < 0) return;
        var bag = st.per[c.id] || (st.per[c.id] = freshPerson());
        var face = c.portrait ? h("div", { class: "face" }, h("img", { src: c.portrait, alt: "" })) : h("div", { class: "face" }, h("span", { class: "blank", text: "?" }));
        var nameField = null;
        if (c.id === "new") {
          var nf = h("input", { class: "field", type: "text", value: st.newName || "", "aria-label": "Their name", placeholder: "Their name, if they have one" });
          nf.addEventListener("input", function () { st.newName = nf.value; save(); });
          nameField = nf;
        }
        people.appendChild(h("section", { class: "person", style: "--accent:" + c.color, "aria-label": c.name },
          h("div", { class: "person-head" }, face,
            h("div", null, h("h3", { text: c.name }), h("p", { text: c.intro }), h("p", { class: "open-line", text: c.open }))),
          nameField,
          pc.choices.map(function (ch) { return choiceBlock(bag.choices, ch, save); }),
          pc.questions.map(function (q) { return questionBlock(bag, q, save); }),
          c.extra && c.extra.length ? h("div", null,
            h("p", { class: "eyebrow", style: "margin-top:18px", text: "Just for " + c.name }),
            c.extra.map(function (q) { return questionBlock(bag, q, save); })) : null,
          h("details", { class: "more" },
            h("summary", { text: "More about " + (c.id === "new" ? "them" : c.name) }),
            pc.more.map(function (q) { return questionBlock(bag, q, save); }))
        ));
      });
      if (!st.selected.length) people.appendChild(h("p", { class: "empty", text: "Pick someone above to begin. You can pick more than one." }));
    }

    function charOptions(selected) {
      return [h("option", { value: "", text: "Choose…" })].concat(CHARS.map(function (c) {
        return h("option", { value: c.id, selected: c.id === selected ? "selected" : null, text: c.id === "new" ? "Someone new" : c.name });
      }));
    }
    function paintPairs() {
      pairs.innerHTML = "";
      st.pairs.forEach(function (p, i) {
        var a = h("select", { class: "field", "aria-label": "First person" }, charOptions(p.a));
        var b = h("select", { class: "field", "aria-label": "Second person" }, charOptions(p.b));
        a.addEventListener("change", function () { p.a = a.value; save(); });
        b.addEventListener("change", function () { p.b = b.value; save(); });
        var ta = h("textarea", { "aria-label": "What would they talk about?", placeholder: "What would they talk about, or carefully avoid talking about?" });
        ta.value = p.text || "";
        autosize(ta);
        ta.addEventListener("input", function () { p.text = ta.value; save(); });
        pairs.appendChild(h("div", { class: "sheet" },
          h("div", { class: "pair-row" }, a, h("span", { text: "and" }), b), ta,
          st.pairs.length > 1 ? h("button", { type: "button", class: "btn btn-quiet btn-small remove", text: "Remove this pair", onclick: function () {
            st.pairs.splice(i, 1); save(); paintPairs();
          } }) : null));
      });
    }

    var grid = h("div", { class: "cast", role: "group", "aria-label": "Characters" });
    CHARS.forEach(function (c) {
      var on = st.selected.indexOf(c.id) >= 0;
      var btn = h("button", { type: "button", class: "cast-card", style: "--accent:" + c.color, "aria-pressed": on ? "true" : "false", "aria-label": c.name + (c.id === "new" ? ": a character of your own" : "") },
        h("span", { class: "cast-check", "aria-hidden": "true" }),
        h("span", { class: "cast-portrait" }, c.portrait ? h("img", { src: c.portrait, alt: "", loading: "lazy" }) : h("span", { class: "blank", text: "+" })),
        h("span", { class: "cast-name", text: c.name }),
        h("span", { class: "cast-hint", text: c.id === "new" ? "Invent someone" : "" }));
      btn.addEventListener("click", function () {
        var i = st.selected.indexOf(c.id);
        if (i >= 0) st.selected.splice(i, 1); else st.selected.push(c.id);
        btn.setAttribute("aria-pressed", i >= 0 ? "false" : "true");
        save();
        paintPeople();
      });
      grid.appendChild(btn);
    });

    paintPeople();
    paintPairs();
    var content = h("div", null,
      h("section", { class: "block" }, h("h2", { text: "Who's on your mind?" }), grid),
      people,
      h("section", { class: "block" }, h("h2", { text: "Two in a room" }),
        h("p", { class: "q-label", text: t.pairs.prompt }), h("p", { class: "q-hint", text: t.pairs.hint }),
        pairs,
        h("div", { class: "add-row" }, h("button", { type: "button", class: "btn btn-small", text: "Add another pair", onclick: function () {
          st.pairs.push({ a: "", b: "", text: "" }); save(); paintPairs();
        } }))),
      freeBlock(st, t.freewrite, save)
    );
    setView(topicShell(t, content), t.title);
  }

  function singlePick(options, current, onPick, label, allowOwn) {
    var row = h("div", { class: "chips", role: "group", "aria-label": label });
    var all = options.concat(allowOwn ? ["__own"] : []);
    all.forEach(function (opt) {
      var b = h("button", { type: "button", class: "chip", "aria-pressed": current === opt ? "true" : "false", text: opt === "__own" ? "My own" : opt });
      b.addEventListener("click", function () {
        var next = current === opt ? "" : opt;
        current = next;
        row.querySelectorAll(".chip").forEach(function (x, i) { x.setAttribute("aria-pressed", all[i] === next ? "true" : "false"); });
        onPick(next);
      });
      row.appendChild(b);
    });
    return row;
  }

  function viewScenes(t) {
    var st = state.topics[t.id];
    var save = function () { saveTopic(t.id); };
    var list = h("div");
    function paint() {
      list.innerHTML = "";
      st.scenes.forEach(function (s, i) {
        var own = h("textarea", { "aria-label": "Your own situation", placeholder: "Describe the situation." });
        own.value = s.ownPrompt || ""; autosize(own);
        own.addEventListener("input", function () { s.ownPrompt = own.value; save(); });
        var ownWrap = h("div", null, own); ownWrap.hidden = s.prompt !== "__own";
        var ownSet = h("input", { class: "field", type: "text", value: s.ownSetting || "", "aria-label": "Your own setting", placeholder: "Where are they?" });
        ownSet.addEventListener("input", function () { s.ownSetting = ownSet.value; save(); });
        var ownSetWrap = h("div", { class: "other-row" }, ownSet); ownSetWrap.hidden = s.setting !== "__own";

        var promptList = h("div", { class: "chips", role: "group", "aria-label": "Situation" });
        var allPrompts = t.scene.prompts.concat(["__own"]);
        allPrompts.forEach(function (p) {
          var b = h("button", { type: "button", class: "chip", style: "text-align:left", "aria-pressed": s.prompt === p ? "true" : "false", text: p === "__own" ? "My own situation" : p });
          b.addEventListener("click", function () {
            s.prompt = s.prompt === p ? "" : p;
            promptList.querySelectorAll(".chip").forEach(function (x, j) { x.setAttribute("aria-pressed", allPrompts[j] === s.prompt ? "true" : "false"); });
            ownWrap.hidden = s.prompt !== "__own";
            if (s.prompt === "__own") own.focus();
            save();
          });
          promptList.appendChild(b);
        });

        var castRow = h("div", { class: "chips", role: "group", "aria-label": "Cast" });
        CHARS.forEach(function (c) {
          var on = s.cast.indexOf(c.id) >= 0;
          var b = h("button", { type: "button", class: "chip", "aria-pressed": on ? "true" : "false", text: c.id === "new" ? "Someone new" : c.name });
          b.addEventListener("click", function () {
            var k = s.cast.indexOf(c.id);
            if (k >= 0) s.cast.splice(k, 1); else s.cast.push(c.id);
            b.setAttribute("aria-pressed", k >= 0 ? "false" : "true");
            save();
          });
          castRow.appendChild(b);
        });

        var lines = h("textarea", { class: "big", "aria-label": "Your scene", placeholder: "REINA: You're early.\nYATO: The train is late. I'm on time.\n\n(Any format. Prose, script, a few lines of dialogue.)" });
        lines.value = s.text || ""; autosize(lines);
        lines.addEventListener("input", function () { s.text = lines.value; save(); });

        list.appendChild(h("section", { class: "sheet", "aria-label": "Scene " + (i + 1) },
          h("h3", { text: "Scene " + (i + 1) }),
          h("span", { class: "sub-label", text: "The situation" }), promptList, ownWrap,
          h("span", { class: "sub-label", text: "Who's there" }), castRow,
          h("span", { class: "sub-label", text: "Where" }),
          singlePick(t.scene.settings, s.setting, function (v) { s.setting = v; ownSetWrap.hidden = v !== "__own"; if (v === "__own") ownSet.focus(); save(); }, "Setting", true), ownSetWrap,
          h("span", { class: "sub-label", text: "The mood (optional)" }),
          singlePick(t.scene.tones, s.tone, function (v) { s.tone = v; save(); }, "Tone", false),
          h("span", { class: "sub-label", text: "Now write a few lines" }), lines,
          st.scenes.length > 1 ? h("button", { type: "button", class: "btn btn-quiet btn-small remove", text: "Remove this scene", onclick: function () {
            if (!s.text || window.confirm("Remove this scene and its lines?")) { st.scenes.splice(i, 1); save(); paint(); }
          } }) : null));
      });
    }
    paint();
    var content = h("div", null, list,
      h("div", { class: "add-row" }, h("button", { type: "button", class: "btn", text: "Write another scene", onclick: function () {
        st.scenes.push(freshScene()); save(); paint();
        var last = list.lastElementChild; if (last) last.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      } })),
      freeBlock(st, t.freewrite, save));
    setView(topicShell(t, content), t.title);
  }

  function viewWild(t) {
    var st = state.topics[t.id];
    var save = function () { saveTopic(t.id); };
    var list = h("div");
    function paint() {
      list.innerHTML = "";
      st.ideas.forEach(function (idea, i) {
        var title = h("input", { class: "field", type: "text", value: idea.title || "", "aria-label": "A name for this idea", placeholder: "A name for it (optional)" });
        title.addEventListener("input", function () { idea.title = title.value; save(); });
        var ta = h("textarea", { class: "big", "aria-label": "Your idea", placeholder: "Write it however it comes to you." });
        ta.value = idea.text || ""; autosize(ta);
        ta.addEventListener("input", function () { idea.text = ta.value; save(); });
        list.appendChild(h("section", { class: "sheet", "aria-label": "Idea " + (i + 1) },
          h("h3", { text: "Idea " + (i + 1) }),
          h("span", { class: "sub-label", text: "What kind of idea? (optional)" }),
          singlePick(t.kinds, idea.kind, function (v) { idea.kind = v; save(); }, "Kind of idea", false),
          h("span", { class: "sub-label", text: "Its name" }), title,
          h("span", { class: "sub-label", text: "The idea" }), ta,
          st.ideas.length > 1 ? h("button", { type: "button", class: "btn btn-quiet btn-small remove", text: "Remove this idea", onclick: function () {
            if (!idea.text || window.confirm("Remove this idea?")) { st.ideas.splice(i, 1); save(); paint(); }
          } }) : null));
      });
    }
    paint();
    var content = h("div", null, list,
      h("div", { class: "add-row" }, h("button", { type: "button", class: "btn", text: "Add another idea", onclick: function () {
        st.ideas.push({ kind: "", title: "", text: "" }); save(); paint();
        var last = list.lastElementChild; if (last) last.querySelector("textarea").focus();
      } })));
    setView(topicShell(t, content), t.title);
  }

  // ------------------------------------------------------------ review and send
  function copyText(text, btn) {
    var done = function (ok) {
      var old = btn.getAttribute("data-label");
      btn.textContent = ok ? "Copied" : "Select and copy below";
      btn.classList.toggle("copied", ok);
      setTimeout(function () { btn.textContent = old; btn.classList.remove("copied"); }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else done(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    var ta = h("textarea", { style: "position:fixed;left:-9999px;top:0", "aria-hidden": "true" });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function download(text) {
    var who = (state.meta.name || "guest").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "guest";
    var d = new Date();
    var name = "u2m-writers-room-" + who + "-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".txt";
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = h("a", { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function confirmDialog(title, text, yes, onYes) {
    var back = h("div", { class: "dialog-back" });
    var no = h("button", { type: "button", class: "btn", text: "Keep everything" });
    var go = h("button", { type: "button", class: "btn btn-primary", text: yes });
    var box = h("div", { class: "dialog", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "dlg-t", "aria-describedby": "dlg-d" },
      h("h2", { id: "dlg-t", text: title }), h("p", { id: "dlg-d", text: text }), h("div", { class: "send-actions" }, no, go));
    back.appendChild(box);
    var close = function () { back.remove(); document.removeEventListener("keydown", key); };
    var key = function (e) { if (e.key === "Escape") close(); };
    no.addEventListener("click", close);
    go.addEventListener("click", function () { close(); onYes(); });
    document.addEventListener("keydown", key);
    document.body.appendChild(back);
    no.focus();
  }

  function viewReview() {
    var entries = allEntries();
    var header = exportHeader();
    var body = h("div");
    if (!entries.length) {
      body.appendChild(h("p", { class: "empty", text: "Nothing written yet. When you add something in any room, it shows up here, ready to send." }));
      body.appendChild(h("p", null, h("a", { class: "btn", href: "#/areas", text: "Go to the rooms" })));
    } else {
      var curSec = null, curSub = null, secEl = null, dl = null;
      entries.forEach(function (e) {
        if (e.section !== curSec) {
          curSec = e.section; curSub = null;
          var t = TOPICS.filter(function (x) { return x.title === e.section; })[0];
          secEl = h("section", { class: "review-section" },
            h("h2", null, e.section),
            t ? h("p", null, h("a", { href: "#/area/" + t.id, text: "Edit this room" })) : null);
          body.appendChild(secEl);
          dl = null;
        }
        if (e.sub !== curSub) {
          curSub = e.sub;
          if (e.sub) secEl.appendChild(h("p", { class: "review-sub", text: e.sub }));
          dl = null;
        }
        if (!dl) { dl = h("dl"); secEl.appendChild(dl); }
        dl.appendChild(h("div", { class: "review-item" }, h("dt", { text: e.q }), h("dd", { text: e.a })));
      });
    }

    var send = null;
    if (entries.length) {
      var parts = window.WRChunker.discordParts(entries, header, LIMIT);
      var doc = window.WRChunker.textDocument(entries, header);
      var partList = h("div");
      parts.forEach(function (p, i) {
        var label = "Copy part " + (i + 1);
        var btn = h("button", { type: "button", class: "btn btn-small", "data-label": label, text: label, "aria-label": "Copy part " + (i + 1) + " of " + parts.length });
        btn.addEventListener("click", function () { copyText(p, btn); });
        partList.appendChild(h("div", { class: "part" },
          h("div", { class: "part-head" }, h("strong", { text: "Part " + (i + 1) + " of " + parts.length }), h("span", { class: "len", text: p.length + " characters" }), btn),
          h("pre", { tabindex: "0", "aria-label": "Part " + (i + 1) + " text" }, p)));
      });
      var dlBtn = h("button", { type: "button", class: "btn btn-primary", text: "Download as a text file" });
      dlBtn.addEventListener("click", function () { download(doc); });
      send = h("section", { class: "send", "aria-labelledby": "send-t" },
        h("h2", { id: "send-t", text: "Send it over" }),
        h("p", { class: "soft", text: "For Discord: copy each part in order and paste it as its own message (" + plural(parts.length, "part", "parts") + ", each under " + LIMIT + " characters). Or download everything as one text file and attach it." }),
        h("div", { class: "send-actions" }, dlBtn),
        partList);
    }

    var clear = h("div", { class: "danger" }, h("button", { type: "button", class: "btn btn-quiet", text: "Clear all my drafts from this browser", onclick: function () {
      confirmDialog("Clear every draft?", "This removes everything you've written here from this browser. Download or copy anything you want to keep first.", "Clear everything", function () {
        removeAll();
        state.meta = { name: "" };
        TOPICS.forEach(function (t) { state.topics[t.id] = freshTopic(t); });
        location.hash = "#/";
        viewWelcome();
      });
    } }));

    setView(h("div", null,
      h("section", { class: "banner", style: "background-image:url('assets/art/review.webp')" },
        h("div", { class: "narrow" },
          h("p", { class: "eyebrow", text: "Before you send" }),
          h("h1", { text: "Review & send" }),
          h("div", { class: "rule" }),
          h("div", { class: "intro" }, h("p", { text: "Here's everything you've written, exactly as it will be sent. Thank you for writing it." })))),
      h("div", { class: "narrow" },
        h("p", { class: "notice", role: "note", text: NOT_CANON }),
        send, body, entries.length ? clear : null)
    ), "Review & send");
  }

  // ------------------------------------------------------------ router
  function route() {
    var parts = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    if (parts[0] === "areas") return viewAreas();
    if (parts[0] === "review") return viewReview();
    if (parts[0] === "area") {
      var t = TOPICS.filter(function (x) { return x.id === parts[1]; })[0];
      if (!t) return viewAreas();
      if (t.mode === "characters") return viewCharacters(t);
      if (t.mode === "scenes") return viewScenes(t);
      if (t.mode === "wild") return viewWild(t);
      return viewStandard(t);
    }
    return viewWelcome();
  }
  window.addEventListener("hashchange", route);
  // keep anything typed in the last quarter second before the tab closes
  window.addEventListener("pagehide", function () {
    Object.keys(saveTimers).forEach(function (id) { clearTimeout(saveTimers[id]); store("topic:" + id, state.topics[id]); });
  });
  route();
  if (!storageOk) showSaved(false);
})();
