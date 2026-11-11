/*
  The Writer's Room: the six creative areas.

  Edit freely. Keep ids stable once people have started answering (drafts are saved by id).
  Every question can be skipped; nothing here is canon, and the page says so.

  Shared shape:
    id, title, kicker, minutes, art (background), card (card image), ink (small illustration)
    intro      paragraphs shown at the top
    choices    quick picks: { id, prompt, options: [...], multi: true|false, other: true|false }
    questions  the two or three main open questions: { id, prompt, hint?, sparks?: [...] }
    more       optional deeper questions, folded away until opened
    freewrite  { id, prompt } an open page at the end

  Special modes:
    "characters"  the contributor picks characters; `perCharacter` repeats for each one
    "scenes"      a small scene builder (`scene`): prompt, cast, setting, tone, then lines
    "wild"        a list of ideas, each with an optional kind and title
*/
window.WR_TOPICS = [
  {
    id: "characters",
    mode: "characters",
    title: "Characters and Relationships",
    kicker: "The people",
    minutes: "4 to 7 minutes",
    art: "assets/art/characters.webp",
    card: "assets/art/characters_card.webp",
    ink: "assets/ink/characters.svg",
    intro: [
      "Pick one person, or a few. You'll get the same handful of questions for each, plus one or two that belong to them alone.",
      "You don't need to know them well. A first impression is still useful to a writer."
    ],
    perCharacter: {
      choices: [
        { id: "weather", prompt: "Their weather", options: ["Rain on neon", "Still fog", "The first cold morning", "A thunderstorm they pretend not to enjoy", "Heat that won't break"], multi: false, other: true },
        { id: "groupchat", prompt: "In a group chat, they are…", options: ["One emoji, no words", "Voice notes only", "Reads everything, replies tomorrow", "Keeps the shared calendar", "Sends a photo of the sky, no context"], multi: false, other: true }
      ],
      questions: [
        { id: "interesting", prompt: "What makes them interesting to you?" },
        { id: "ordinary_day", prompt: "What would they be like on a completely ordinary day?" },
        { id: "habit", prompt: "What unexpected habit would suit them?" }
      ],
      more: [
        { id: "laugh", prompt: "What would make them laugh?" },
        { id: "bad_at", prompt: "What are they surprisingly bad at?" },
        { id: "relationship", prompt: "Who would they have the most interesting relationship with, and why that person?" },
        { id: "contradiction", prompt: "What personal contradiction would make them more believable?" }
      ]
    },
    pairs: { id: "pairs", prompt: "Which two people would you love to see in a conversation together?", hint: "Pick two, then say what they'd talk about (or avoid talking about)." },
    freewrite: { id: "free", prompt: "Anything else about these people, in your own words." }
  },

  {
    id: "world",
    title: "The World and Everyday Life",
    kicker: "Kurohama",
    minutes: "3 to 6 minutes",
    art: "assets/art/world.webp",
    card: "assets/art/world_card.webp",
    ink: "assets/ink/world.svg",
    intro: [
      "Kurohama is an ordinary city, where people work late and buy something warm from a vending machine after missing the last train.",
      "Help it feel lived in. The places suggested below are only sparks to borrow or ignore; none of them is a confirmed location."
    ],
    choices: [
        { id: "sound", prompt: "Kurohama at 1 AM sounds like…", options: ["Rain on shop shutters", "A train somewhere far off", "A vending machine humming", "Someone laughing a little too loudly", "Nothing at all, which is worse"], multi: true, other: true },
        { id: "getting_around", prompt: "The best way to get around", options: ["The last train", "A bicycle in the rain", "The river path on foot", "A taxi with a talkative driver"], multi: false, other: true }
    ],
    questions: [
      { id: "memorable_place", prompt: "What kind of place should become memorable?", sparks: ["A late-night diner", "An unusual bookstore", "A riverside market", "A forgotten shrine", "An apartment building with strange neighbours"] },
      { id: "off_hours", prompt: "Where do people spend time when they're not working?" },
      { id: "mundane_odd", prompt: "What supernatural detail might turn up in an otherwise mundane place?" }
    ],
    more: [
      { id: "traditions", prompt: "What local habits or traditions might exist here?" },
      { id: "comforting", prompt: "What would make Kurohama feel comforting?" },
      { id: "unsettling", prompt: "And what would make it unsettling?" },
      { id: "return_to", prompt: "Which recurring place would you want to keep coming back to?" }
    ],
    freewrite: { id: "free", prompt: "Describe a street, a room, a smell, a regular customer. Anything." }
  },

  {
    id: "lore",
    title: "Supernatural Lore",
    kicker: "Under the moons",
    minutes: "4 to 7 minutes",
    art: "assets/art/lore.webp",
    card: "assets/art/lore_card.webp",
    ink: "assets/ink/lore.svg",
    intro: [
      "There are two realms: Asterra, where humans live, and Veyrath, where demons live. Both are full of ordinary people. A demon is not automatically a monster, and a human is not automatically good.",
      "Aether is the power some people can draw on. Wards and shrines keep things where they belong. When those fail, the world can break open in an anomaly called an Overlap.",
      "Two moons hang over the city: a large pale one and a smaller red one. Most nights, that's just the sky."
    ],
    choices: [
      { id: "find_at_home", prompt: "Which would you rather find in your apartment?", options: ["A ward drawn in a stranger's handwriting", "A door that wasn't there yesterday", "A houseplant that leans toward the red moon", "A demon neighbour asking to borrow sugar"], multi: false, other: true },
      { id: "rumour", prompt: "A rumour every Kurohama kid has heard", options: ["Don't answer a payphone after midnight", "Some stairs have one step too many", "Never thank a shrine fox out loud", "Count the lanterns on the way home: if there's one more, take another street"], multi: false, other: true }
    ],
    questions: [
      { id: "phenomenon", prompt: "What strange phenomenon would be fascinating to encounter?" },
      { id: "harmless_oddity", prompt: "What harmless supernatural oddity might just be part of everyday life?" },
      { id: "misconception", prompt: "What might humans get wrong about demons, or demons about humans?" }
    ],
    more: [
      { id: "demon_culture", prompt: "What cultural detail could make Veyrath feel distinct?" },
      { id: "unsettling_rule", prompt: "What unsettling rule or mystery would make the setting more memorable?" },
      { id: "limited_ability", prompt: "Describe a supernatural ability that's interesting specifically because of its limitation." }
    ],
    freewrite: { id: "free", prompt: "Any rule, ritual or rumour you'd like to exist." }
  },

  {
    id: "stories",
    title: "Stories and Difficult Choices",
    kicker: "What stays with you",
    minutes: "3 to 6 minutes",
    art: "assets/art/stories.webp",
    card: "assets/art/stories_card.webp",
    ink: "assets/ink/stories.svg",
    intro: [
      "These questions are about the stories you love and why they stay with you. You won't be asked to guess what happens next in this one.",
      "Feel free to contradict yourself."
    ],
    choices: [
      { id: "more_interesting", prompt: "Which makes a character more interesting?", options: ["A secret", "A contradiction", "A mistake", "An unexpected kindness"], multi: false, other: true },
      { id: "would_rather", prompt: "Would you rather see a character…", options: ["Challenge authority", "Confront their past", "Question a belief", "Protect something important"], multi: true, other: true }
    ],
    questions: [
      { id: "memorable_decision", prompt: "What kind of decision makes you remember a story?" },
      { id: "consequence", prompt: "What kind of consequence should follow a difficult decision?" },
      { id: "earned_reveal", prompt: "What makes a reveal feel earned rather than forced?" }
    ],
    more: [
      { id: "why_choice", prompt: "Looking at your picks above: why those?" },
      { id: "another_story", prompt: "What would make you eager to play another character's story?" }
    ],
    freewrite: { id: "free", prompt: "A story (from anywhere) that did this well, and what it got right." }
  },

  {
    id: "scenes",
    mode: "scenes",
    title: "Scenes and Dialogue",
    kicker: "A few lines",
    minutes: "3 to 7 minutes",
    art: "assets/art/scenes.webp",
    card: "assets/art/scenes_card.webp",
    ink: "assets/ink/scenes.svg",
    intro: [
      "Pick a situation and who's in it, then where it happens and the mood if you like, and write a few lines. A rough draft is fine.",
      "Write as many scenes as you like."
    ],
    scene: {
      prompts: [
        "Two characters are stuck waiting for a train that is late. What do they talk about?",
        "Someone buys the wrong drink for a colleague. What happens?",
        "A character discovers something peculiar in their apartment.",
        "Two coworkers disagree over something completely trivial.",
        "Someone says something unexpectedly sincere and immediately regrets being vulnerable.",
        "Write a short exchange that shows a relationship without explaining it."
      ],
      settings: ["A station platform", "A 24-hour konbini", "A rooftop in the rain", "A shared office at closing time", "A riverside bench", "A shrine at dawn"],
      tones: ["Playful", "Cozy", "Melancholic", "Tense", "Mysterious", "Absurd"]
    },
    freewrite: { id: "free", prompt: "Notes on any of your scenes, or a moment you'd love to see animated." }
  },

  {
    id: "wild",
    mode: "wild",
    title: "Wild Ideas",
    kicker: "Anything at all",
    minutes: "As long as you like",
    art: "assets/art/wild.webp",
    card: "assets/art/wild_card.webp",
    ink: "assets/ink/wild.svg",
    intro: [
      "Anything you wish existed in Under Two Moons? A character, a strange location, a supernatural rule, a funny exchange, a mystery, a friendship, a scene, or something completely ridiculous?",
      "Small ideas and very strange ones are both welcome here."
    ],
    kinds: ["Character", "Place", "Supernatural rule", "Funny exchange", "Mystery", "Friendship", "Scene", "Completely ridiculous"]
  }
];
