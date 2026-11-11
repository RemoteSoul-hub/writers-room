/*
  The Writer's Room: characters.

  Edit freely. Each entry is spoiler-safe by design: it says only what the game itself
  shows. Do not add backstory, future events or anything a player hasn't seen.

  id        stable key used in saved drafts (don't rename once people have answered)
  name      shown everywhere
  color     accent for their card
  portrait  path to an image in assets/portraits/ ("" for none)
  intro     one or two neutral sentences
  open      a short line that makes clear what is still undecided
  extra     optional questions only for this character
*/
window.WR_CHARACTERS = [
  {
    id: "yato",
    name: "Yato",
    color: "#c4373f",
    portrait: "assets/portraits/yato.webp",
    intro: "Yato is dry, observant and compassionate. He has a Death Sense: a sudden, painful warning when someone nearby is close to dying.",
    open: "He speaks sparingly. What he's like on a night when nothing goes wrong is still wide open.",
    extra: [
      { id: "safe_day", prompt: "Yato is always half listening for danger. What does a genuinely safe hour feel like to him?" },
      { id: "vending", prompt: "He's standing at a vending machine at 3 AM. What does he buy, and does he hesitate?" }
    ]
  },
  {
    id: "reina",
    name: "Reina",
    color: "#3b6fd6",
    portrait: "assets/portraits/reina.webp",
    intro: "Reina is disciplined and direct, and she protects people without talking down to them. Her Aether burns azure.",
    open: "Most of who she is away from work hasn't been written yet.",
    extra: [
      { id: "line", prompt: "She protects people without patronising them. Where do you think she draws that line?" },
      { id: "teach", prompt: "What would Reina be surprisingly bad at teaching someone?" }
    ]
  },
  {
    id: "ren",
    name: "Ren",
    color: "#8a5fd1",
    portrait: "assets/portraits/ren.webp",
    intro: "Ren is analytical and understated. He's rarely without a book, and there's usually a pencil or two behind his ear.",
    open: "He says little about himself. Everything beyond that is yours to imagine.",
    extra: [
      { id: "notice", prompt: "Ren notices details. What would he notice about you within a minute of meeting you?" },
      { id: "desk", prompt: "What's on his desk that has nothing to do with work?" }
    ]
  },
  {
    id: "hina",
    name: "Hina",
    color: "#e0a640",
    portrait: "assets/portraits/hina.webp",
    intro: "The one the others call when they need to know what a seal was doing.",
    open: "Very little about her is public yet. Start from scratch.",
    extra: [
      { id: "beautiful", prompt: "What would someone who reads seals for a living find beautiful?" }
    ]
  },
  {
    id: "nyra",
    name: "Nyra",
    color: "#d9b8e6",
    portrait: "assets/portraits/nyra.webp",
    intro: "Echo: replays, copies and mirrors. She breaks the rules on purpose.",
    open: "That one line is all the game says about her so far.",
    extra: [
      { id: "imitate", prompt: "She copies and mirrors. Who would she imitate just for fun, and who would hate it most?" }
    ]
  },
  {
    id: "daichi",
    name: "Daichi",
    color: "#e2722e",
    portrait: "assets/portraits/daichi.webp",
    intro: "Resolve: takes the pressure, refuses to move, answers it with everything.",
    open: "That one line is all the game says about him so far.",
    extra: [
      { id: "stubborn", prompt: "He refuses to move under pressure. What small, everyday thing would he be stubborn about?" }
    ]
  },
  {
    id: "saki",
    name: "Saki",
    color: "#2fbfa8",
    portrait: "assets/portraits/saki.webp",
    intro: "Tether: prepare, bind, detonate.",
    open: "That one line is all the game says about her so far.",
    extra: [
      { id: "plans", prompt: "Prepare, bind, detonate. How does that show up when she plans a free weekend?" }
    ]
  }
];

/* An option for people who want to invent someone. Answers are kept like any character's. */
window.WR_NEW_CHARACTER = {
  id: "new",
  name: "Someone new",
  color: "#c9c2b6",
  portrait: "",
  intro: "A character of your own, like a neighbour or a stranger on the last train.",
  open: "Give them a name if you like. Nothing about them exists yet.",
  extra: [
    { id: "who", prompt: "Who are they, in a sentence or two?" }
  ]
};
