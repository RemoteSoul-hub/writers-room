# The Writer's Room

A small, standalone website for Under Two Moons: a friend opens it, wanders through six
creative rooms (characters, the city, lore, stories, scenes, wild ideas), and sends back what
they wrote as Discord messages or a text file.

It is plain HTML, CSS and JavaScript. No build step, no backend, no accounts, no analytics.
It is completely separate from the Godot project and never touches the game or its saves.

## Try it on your computer

Open `index.html` in a browser. That's all.

For the closest match to the published site, serve the folder instead, for example
`npx serve .` or `python -m http.server 8000` from this folder, then open the address it
prints. (Fonts load from Google Fonts, so an internet connection makes it look right.)

## What's where

| Path | What it is |
|---|---|
| `index.html` | The page shell |
| `config/characters.js` | The characters: name, colour, portrait, introduction, their own questions |
| `config/topics.js` | The six rooms: introductions, quick picks, questions, prompts |
| `css/style.css` | The look |
| `js/app.js` | The page logic: rooms, drafts, review, export |
| `js/chunker.js` | Discord parts and the text file |
| `assets/art/` | Backgrounds and card images (web copies of the game's location paintings) |
| `assets/portraits/` | Character portraits (web copies of the game's portraits) |
| `assets/ink/` | Small original ink illustrations for the room cards (SVG) |
| `tests/chunker.test.js` | Tests for the Discord splitting (`node tests/chunker.test.js`) |

## Editing the questions and characters

Everything people see lives in the two files in `config/`. Change the wording, add or remove
questions and quick picks, or add a character; reload the page to see it. Comments at the top
of each file describe the fields.

Keep each `id` the same once people have started answering: drafts are saved by id, so a
renamed id starts that question fresh.

To replace an image, drop a new file in `assets/` and point the config at it. Portraits look
best as a transparent full figure; the art as a 16:9 landscape.

## Spoilers

The site only uses the public setting (Kurohama, the two realms, Aether, wards, Overlaps, the
two moons) and what the game itself shows about each character. Nothing about unreleased story
is in any file here, including comments and data. Keep it that way when editing: if something
hasn't been shown to players, leave it out rather than hinting at it.

The page reminds people throughout that what they write is a suggestion, not canon.

## Drafts and privacy

- Answers are saved in the visitor's own browser (localStorage), one entry per room, as they
  type. Coming back later picks up where they left off, on the same browser and device.
- Nothing is uploaded. The only way anything leaves the browser is when the visitor copies the
  Discord parts or downloads the text file.
- "Clear all my drafts" on the review page removes everything from that browser.
- Private browsing windows may not keep drafts after closing; the page warns when the browser
  refuses to save.
- The only outside request is to Google Fonts for the two typefaces. To avoid that, download
  Cinzel and Cormorant Garamond (both under the Open Font License), put them in `assets/fonts/`,
  and replace the Google Fonts link in `index.html` with `@font-face` rules.

## Exports

- **Discord:** numbered parts, each at most 1,800 characters including its "Part n of N" line.
  Parts break between questions; a single answer longer than a part is split at a paragraph,
  line, sentence or space, marked "(continued)" and "(continues in the next part)", with every
  character kept. Each part repeats its room and character so it reads on its own.
- **Text file:** everything in one `.txt` file, answers exactly as written.

## Publishing it as a static website

It's ready to host anywhere that serves static files. Any of these is free and takes a few
minutes. Publish only when you're ready for others to see it.

- **Netlify Drop:** go to app.netlify.com/drop and drag this folder onto the page. You get a
  link right away; sign in to keep it.
- **Cloudflare Pages:** create a project, choose "Upload assets", upload this folder. No build
  command.
- **GitHub Pages:** put this folder's contents in a repository, then Settings, Pages, deploy
  from the main branch, root folder.

The page carries `<meta name="robots" content="noindex">`, so search engines are asked not to
list it; the link is the way in. Share the link privately.

Before publishing, check that you're happy for the game's art and portraits in `assets/` to be
visible to anyone with the link.

## Tests

- `node tests/chunker.test.js`: the Discord splitting (no dependencies; 301 checks).
- A browser pass (desktop 1440x900 and phone 390x844) was run when this was built: every room
  filled in, a skipped question, a reload to check drafts, the Discord parts and the text file,
  reduced motion, keyboard use of the quick picks, and clearing drafts.
