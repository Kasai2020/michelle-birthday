// ─────────────────────────────────────────────────────────────────────
//  🎂  THE GAME CONTENT  —  ✏️ THIS IS THE FILE YOU CUSTOMISE
// ─────────────────────────────────────────────────────────────────────
//
//  Everything below is placeholder. Replace it with real Michelle facts.
//  You can add/remove/reorder rounds freely — the game adapts.
//
//  ROUND TYPES
//  ───────────
//  "trivia"     multiple choice. `answer` is the 0-based index of the
//               right option. Optional `image` (any URL) shows a photo.
//  "age"        guess a number. Closest wins most; exact gets a bonus.
//  "chronology" put events in order. List `items` in the CORRECT order —
//               the game shuffles them for players.
//  "majority"   no right answer: you score by matching what most of the
//               group picked. Great for chaos.
//
//  Per-round knobs: `duration` (seconds), `multiplier` (point multiplier,
//  use 2 for a dramatic final round), `emoji`, `blurb`.
// ─────────────────────────────────────────────────────────────────────

export const CELEBRANT = {
  name: "Michelle",
  age: 25,
  // Shown on the winner screen.
  prize: "gets to pick the next round of drinks 🍸",
};

export const ROUNDS = [

  // ── Round 1 ────────────────────────────────────────────────────────
  {
    type: "trivia",
    name: "Michelle 101",
    emoji: "🧠",
    blurb: "The basics. No excuses.",
    duration: 20,
    questions: [
      {
        q: "What is Michelle's go-to coffee order?",
        options: ["Oat milk latte", "Black drip coffee", "Iced matcha", "Cold brew, no ice"],
        answer: 0,
      },
      {
        q: "Which of these would Michelle absolutely NOT eat?",
        options: ["Olives", "Blue cheese", "Raw tomato", "Cilantro"],
        answer: 3,
      },
      {
        q: "What city was Michelle born in?",
        options: ["San Diego", "Seattle", "Chicago", "Boston"],
        answer: 1,
      },
      {
        q: "Michelle's most-played song of the year was by…",
        options: ["Taylor Swift", "SZA", "Fleetwood Mac", "Chappell Roan"],
        answer: 1,
      },
      {
        // Photo questions: drop any image URL in here (an Imgur link, a
        // GitHub raw link to a file you commit under /img, anything).
        q: "Where was this photo taken?",
        // image: "https://raw.githubusercontent.com/Kasai2020/michelle-birthday/main/img/photo1.jpg",
        options: ["Portugal", "Mexico City", "Big Sur", "Her parents' backyard"],
        answer: 2,
      },
    ],
  },

  // ── Round 2 ────────────────────────────────────────────────────────
  {
    type: "age",
    name: "Guess the Age",
    emoji: "🎈",
    blurb: "How old was she when…? Closest guess takes it.",
    duration: 25,
    questions: [
      { q: "How old was Michelle when she first travelled abroad?", answer: 9,  min: 0, max: 25, unit: "years old" },
      { q: "How old was Michelle in this photo?", answer: 16, min: 0, max: 25, unit: "years old" },
      { q: "How old was Michelle when she got her first job?", answer: 15, min: 0, max: 25, unit: "years old" },
      // `unit` is free text, so this round works for any number question:
      { q: "How many countries has Michelle visited?", answer: 12, min: 0, max: 40, unit: "countries" },
    ],
  },

  // ── Round 3 ────────────────────────────────────────────────────────
  {
    type: "chronology",
    name: "The Michelle Timeline",
    emoji: "⏳",
    blurb: "Tap these in the order they happened. Partial credit counts.",
    duration: 45,
    questions: [
      {
        q: "Put these Michelle milestones in order, earliest first",
        // ⚠️ List in the CORRECT order. Players see them shuffled.
        items: [
          "Learned to ride a bike",
          "Moved out of her parents' house",
          "Adopted her first pet",
          "Met Isaac",
          "Started her current job",
        ],
      },
      {
        q: "Order these trips, earliest first",
        items: [
          "First family road trip",
          "Study abroad",
          "The camping trip that went wrong",
          "Last summer's beach week",
        ],
      },
    ],
  },

  // ── Round 4 ────────────────────────────────────────────────────────
  {
    type: "majority",
    name: "Hive Mind",
    emoji: "🐝",
    blurb: "No right answer — you score by picking what MOST of the room picks.",
    duration: 20,
    questions: [
      {
        q: "Which of us is most likely to be late to Michelle's next party?",
        options: ["Isaac", "Her sister", "Her best friend", "Literally everyone"],
      },
      {
        q: "Michelle's most iconic trait?",
        options: ["The laugh", "The playlists", "The planning spreadsheets", "The snack stash"],
      },
      {
        q: "Best word to describe Michelle at 25?",
        options: ["Unhinged (affectionate)", "Wise elder", "Chaotic good", "Certified adult"],
      },
    ],
  },

  // ── Round 5 — double points finale ─────────────────────────────────
  {
    type: "trivia",
    name: "Sudden Death",
    emoji: "💥",
    blurb: "Everything is worth DOUBLE. Anyone can still win.",
    duration: 15,
    multiplier: 2,
    questions: [
      {
        q: "What's Michelle's biggest irrational fear?",
        options: ["Moths", "Deep water", "Escalators", "Uncrustables"],
        answer: 0,
      },
      {
        q: "Finish the sentence Michelle says constantly: \"I'm not mad, I'm just…\"",
        options: ["…tired", "…hungry", "…disappointed", "…being so normal about it"],
        answer: 3,
      },
      {
        q: "If Michelle could only keep one, she'd keep…",
        options: ["Her phone", "Her coffee maker", "Her skincare shelf", "Isaac"],
        answer: 3,
      },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────
//  Scoring knobs — tweak if a round feels too swingy.
// ─────────────────────────────────────────────────────────────────────
export const SCORING = {
  base: 100,        // points for a correct answer
  speedBonus: 60,   // extra, scaled by how fast you answered
  exactBonus: 40,   // "guess the age" nailed it
  closestBonus: 30, // "guess the age" closest in the room
  perfectBonus: 50, // chronology in perfect order
};

// ── Flattened step list. Each question is one "step" of the game. ────
export const STEPS = ROUNDS.flatMap((round, ri) =>
  (round.questions || []).map((question, qi) => ({
    type: round.type,
    roundIndex: ri,
    roundName: round.name,
    roundEmoji: round.emoji || "🎯",
    roundBlurb: round.blurb || "",
    duration: round.duration || 20,
    multiplier: round.multiplier || 1,
    isRoundStart: qi === 0,
    qNumber: qi + 1,
    qTotal: round.questions.length,
    data: question,
  }))
);
