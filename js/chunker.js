/*
  The Writer's Room: export formatting and Discord chunking.

  Works in the browser (window.WRChunker) and in Node (require) for the tests.

  An entry is { section, sub, q, a }:
    section  the creative area ("Scenes and Dialogue")
    sub      a smaller heading inside it ("Yato", "Scene 2"), or ""
    q        the question or label
    a        the contributor's text, exactly as written

  Discord parts:
    - every part is at most `limit` characters (JavaScript string length, which is never
      less than what Discord counts), its "Part n of N" line included;
    - entries are never split if they fit in a part on their own; parts break between them;
    - an answer longer than a part is split at a paragraph, then a line, then a sentence,
      then a space, and only as a last resort mid-word (never inside an emoji or other
      surrogate pair). Every character is kept: joining the pieces gives the original text.
      Pieces are marked "(continued)" and "(continues in the next part)".
*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WRChunker = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TITLE = "Under Two Moons · The Writer's Room";
  var CONT = " *(continued)*";
  var MORE = "\n*(continues in the next part)*";

  function partLine(n, total) {
    return "**" + TITLE + " · Part " + n + " of " + total + "**\n\n";
  }

  // The heading lines an entry needs: the section and sub only when they change, or always
  // at the top of a part so each part makes sense on its own.
  function context(entry, prev) {
    var out = "";
    if (!prev || prev.section !== entry.section) out += "__**" + entry.section.toUpperCase() + "**__\n";
    if (entry.sub && (!prev || prev.section !== entry.section || prev.sub !== entry.sub)) out += "**" + entry.sub + "**\n";
    return out;
  }

  function qLine(entry, continued) {
    return "> " + entry.q + (continued ? CONT : "") + "\n";
  }

  // Where to cut `text` so the first piece is at most `room` long. Prefers natural breaks
  // in the back half of the window; the cut keeps the separator with the first piece.
  function cutAt(text, room) {
    if (text.length <= room) return text.length;
    var win = text.slice(0, room);
    var floor = Math.floor(room * 0.5);
    var tries = [/\n\n/g, /\n/g, /[.!?。！？…]["'”’)\]]*\s/g, /\s/g];
    for (var t = 0; t < tries.length; t++) {
      var re = tries[t], m, best = -1;
      re.lastIndex = 0;
      while ((m = re.exec(win)) !== null) {
        var end = m.index + m[0].length;
        if (end <= room && end > floor) best = end;
        if (re.lastIndex === m.index) re.lastIndex++;
      }
      if (best > 0) return best;
    }
    var cut = room;   // a hard cut: never between the two halves of a surrogate pair
    var c = text.charCodeAt(cut - 1);
    if (c >= 0xd800 && c <= 0xdbff) cut -= 1;
    return Math.max(1, cut);
  }

  /*
    entries: [{section, sub, q, a}], header: text for the top of part 1 (who, when, the
    not-canon note). Returns an array of strings, each at most `limit` long.
  */
  function discordParts(entries, header, limit) {
    limit = limit || 1800;
    var reserve = partLine(999, 999).length;   // room for the part line, whatever the count
    var budget = limit - reserve;
    if (budget < 200) throw new Error("limit too small");
    var parts = [];
    var cur = "", prev = null;

    function flush() {
      if (cur !== "") parts.push(cur.replace(/\s+$/, ""));
      cur = ""; prev = null;
    }

    if (header) {
      var h = header.replace(/\s+$/, "") + "\n\n";
      // a header longer than a part is split like an answer
      while (h.length > budget) {
        var k = cutAt(h, budget);
        parts.push(h.slice(0, k));
        h = h.slice(k);
      }
      cur = h;
    }

    entries.forEach(function (e) {
      var a = String(e.a == null ? "" : e.a);
      var whole = context(e, prev) + qLine(e, false) + a + "\n\n";
      if (cur.length + whole.length <= budget) {
        cur += whole; prev = e; return;
      }
      flush();
      whole = context(e, null) + qLine(e, false) + a + "\n\n";
      if (whole.length <= budget) {
        cur = whole; prev = e; return;
      }
      // too long for any part: split the answer itself
      var rest = a, first = true;
      while (rest.length > 0) {
        var head = context(e, null) + qLine(e, !first);
        var room = budget - head.length - MORE.length - 2;
        var k2 = cutAt(rest, room);
        var piece = rest.slice(0, k2);
        rest = rest.slice(k2);
        if (rest.length > 0) {
          parts.push(head + piece + MORE);
        } else {
          cur = head + piece + "\n\n"; prev = e;
        }
        first = false;
      }
    });
    flush();

    var total = parts.length;
    return parts.map(function (p, i) {
      var out = partLine(i + 1, total) + p;
      if (out.length > limit) throw new Error("part " + (i + 1) + " is " + out.length + " characters");
      return out;
    });
  }

  // The plain-text document: the same entries, readable in any editor.
  function textDocument(entries, header) {
    var rule = "==================================================";
    var out = [header.replace(/\s+$/, ""), ""];
    var prev = null;
    entries.forEach(function (e) {
      if (!prev || prev.section !== e.section) {
        out.push("", rule, e.section.toUpperCase(), rule, "");
      }
      if (e.sub && (!prev || prev.section !== e.section || prev.sub !== e.sub)) {
        out.push("--- " + e.sub + " ---", "");
      }
      out.push("Q. " + e.q, String(e.a == null ? "" : e.a), "");
      prev = e;
    });
    return out.join("\n").replace(/\n{4,}/g, "\n\n\n") + "\n";
  }

  return { discordParts: discordParts, textDocument: textDocument, cutAt: cutAt, MORE: MORE, CONT: CONT };
});
