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
//  "photoage"   the photo round: a picture, then guess how old she was.
//               Same scoring as "age". See Round 3 for how to add images.
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
        q: "What sport did Michelle play in high school?",
        options: ["Soccer", "Field hockey", "Volleyball", "Lacrosse"],
        answer: 1,
      },
      {
        q: "Michelle's favourite colour?",
        options: ["Sage green", "Lavender", "Pink", "Baby blue"],
        answer: 2,
      },
      {
        q: "Michelle's most-watched movie?",
        options: ["The Devil Wears Prada", "Mamma Mia!", "27 Dresses", "The Proposal"],
        answer: 3,
      },
      {
        q: "Her favourite restaurant in the city?",
        options: ["Kazunori", "Sugarfish", "Via Carota", "Carbone"],
        answer: 0,
      },
    ],
  },

  // ── Round 2 ────────────────────────────────────────────────────────
  //  Number questions. Closest guess wins, exact gets a bonus — much more
  //  fun than multiple choice for anything countable.
  {
    type: "age",
    name: "By The Numbers",
    emoji: "🔢",
    blurb: "No options. Just guess. Closest takes it.",
    duration: 25,
    questions: [
      { q: "How many countries has Michelle been to?", answer: 12, min: 0, max: 40, unit: "countries" },
      { q: "How many cruises has Michelle been on?", answer: 6, min: 0, max: 20, unit: "cruises" },
      { q: "How many times has Michelle spilled coffee on her laptop?", answer: 2, min: 0, max: 10, unit: "times" },
    ],
  },

  // ── Round 3 — 📸 PHOTO ROUND ───────────────────────────────────────
  //
  //  ⚠️ THE AGES BELOW ARE ISAAC-CHECK-THESE ESTIMATES, not facts. I read
  //  them off the photos; correct any that are wrong — it's the `answer`
  //  number on each line and nothing else needs to change.
  //
  //  The photos are deliberately NOT in age order. A run that climbs
  //  steadily is guessable from position alone, which kills the round.
  //
  //  To add more: drop the file in img/, then copy a line below and point
  //  `image` at it. See img/README.md.
  {
    type: "photoage",
    name: "How Old Is She Here?",
    emoji: "📸",
    blurb: "One photo. One guess. Closest wins.",
    duration: 25,
    questions: [
      // Sitting up on the counter, holding the TV remote hostage.
      { image: "../img/photo1-remote.jpg",   caption: "Exhibit A", answer: 1,  min: 0, max: 25 },
      // Wizarding World, mid-broom-theft.
      { image: "../img/photo2-broom.jpg",    caption: "Exhibit B", answer: 9,  min: 0, max: 25 },
      // School uniform, class photo.
      { image: "../img/photo3-uniform.jpg",  caption: "Exhibit C", answer: 5,  min: 0, max: 25 },
      // Pigtails, green jacket, holding a beetle with zero fear.
      { image: "../img/photo4-beetle.jpg",   caption: "Exhibit D", answer: 6,  min: 0, max: 25 },
      // The red-lit grin.
      { image: "../img/photo5-redlight.jpg", caption: "Exhibit E", answer: 4,  min: 0, max: 25 },
    ],
  },

  // ── Round 4 — PARKED ───────────────────────────────────────────────
  //
  //  🅾️ TURNED OFF. `enabled: false` keeps this round out of the game
  //     without deleting it — delete that line (or set it to true) and the
  //     round is back, no other changes needed.
  //
  //  It's off because the items below are still placeholder. To switch it
  //  on: replace them with five things that actually happened to Michelle,
  //  listed EARLIEST FIRST (the game shuffles them for players), then drop
  //  the `enabled` line.
  {
    enabled: false,
    type: "chronology",
    name: "The Michelle Timeline",
    emoji: "⏳",
    blurb: "Tap these in the order they happened. Partial credit counts.",
    duration: 45,
    questions: [
      {
        q: "Put these Michelle milestones in order, earliest first",
        items: [
          "Learned to ride a bike",
          "First cruise",
          "First trip abroad",
          "Met Isaac",
          "Started her current job",
        ],
      },
    ],
  },

  // ── Round 5 ────────────────────────────────────────────────────────
  //  No right answer — you score by matching whatever most of the room
  //  picked. Situations, not people: nobody gets put on the spot, and
  //  everyone can argue about it afterwards.
  {
    type: "majority",
    name: "What Would Michelle Do?",
    emoji: "🐝",
    blurb: "No right answer — score by picking what MOST of the room picks.",
    duration: 20,
    questions: [
      {
        q: "The group chat has 47 unread messages. Michelle…",
        options: [
          "Reads every single one",
          "Scrolls to the bottom and ❤️s the last message",
          "Mutes it and deals with it later",
          "Replies with a two-minute voice memo",
        ],
      },
      {
        q: "She spills coffee on her laptop. AGAIN. First reaction?",
        options: [
          "Silent panic, flips it upside down",
          "Googles whether rice actually works",
          "Texts Isaac before touching anything",
          "Wipes it and never speaks of it",
        ],
      },
      {
        q: "Flight delayed four hours. Michelle…",
        options: [
          "Finds the nearest airport bar",
          "Re-plans the entire trip on the spot",
          "Puts on Friends and disappears",
          "Sleeps through the whole thing",
        ],
      },
      {
        q: "She walks into a party where she knows exactly one person. She…",
        options: [
          "Glues herself to that one person",
          "Works the room like a professional",
          "Locates the dog immediately",
          "Locates the snacks immediately",
        ],
      },
      {
        q: "Ninety-minute wait at the restaurant. Michelle…",
        options: [
          "Puts her name down, waits it out",
          "Already has a backup booked",
          "Drinks at the bar until it's ready",
          "Leaves and finds somewhere else",
        ],
      },
    ],
  },

  // ── Round 6 — double points finale ─────────────────────────────────
  //  Michelle answered these herself, in advance. The room has to guess
  //  what SHE said — so she should be watching, and ideally reading her own
  //  answer out loud on the reveal.
  {
    type: "trivia",
    name: "Michelle Says",
    emoji: "💬",
    blurb: "She already answered these. Guess what she said. DOUBLE POINTS.",
    duration: 20,
    multiplier: 2,
    questions: [
      {
        q: "\u201cIf you could visit any place TOMORROW, where would you go?\u201d",
        options: ["Tokyo", "Hong Kong", "Lisbon", "Seoul"],
        answer: 1,
      },
      {
        q: "\u201cWhat celebrity would you get dinner with?\u201d",
        options: ["Timothée Chalamet", "Pedro Pascal", "Logan Lerman", "Andrew Garfield"],
        answer: 2,
      },
      {
        q: "\u201cWhat is your go-to comfort show?\u201d",
        options: ["The Office", "Friends", "New Girl", "Gilmore Girls"],
        answer: 1,
      },
      {
        q: "\u201cFavourite sitcom character?\u201d",
        options: ["Ron Swanson", "Jim Halpert", "Ben Wyatt", "Chandler Bing"],
        answer: 2,
      },
      {
        q: "\u201cFavourite Harry Potter movie?\u201d",
        options: ["Goblet of Fire", "Prisoner of Azkaban", "Half-Blood Prince", "Deathly Hallows Pt 2"],
        answer: 1,
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

/**
 * Resolves a relative `image` against THIS file's location rather than the
 * page's, so "../img/photo1.jpg" means the repo's img/ folder whether the
 * game is opened at /index.html or /tests/preview.html. Full http(s) URLs
 * are left alone.
 */
const resolveImage = (q) =>
  q.image && !/^(https?:)?\/\//i.test(q.image)
    ? { ...q, image: new URL(q.image, import.meta.url).href }
    : q;

/**
 * Rounds actually in play. A round with `enabled: false` stays in the file —
 * readable, editable, and still checked by the tests — but is skipped by the
 * game entirely, including its round numbering.
 */
export const ACTIVE_ROUNDS = ROUNDS.filter((r) => r.enabled !== false);

// ── Flattened step list. Each question is one "step" of the game. ────
const flatten = (rounds) => rounds.flatMap((round, ri) =>
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
    data: resolveImage(question),
  })));

export const STEPS = flatten(ACTIVE_ROUNDS);

/** Every round including the parked ones — for the tests and the preview page. */
export const ALL_STEPS = flatten(ROUNDS);
