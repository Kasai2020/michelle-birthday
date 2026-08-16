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
        options: ["Kazunori", "Sugarfish", "Din Tai Fung", "Carbone"],
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
  //  HOW TO ADD YOUR PHOTOS
  //  ──────────────────────
  //  1. Put the image files in the `img/` folder of this repo. On github.com
  //     that's: open the img folder → Add file → Upload files → commit.
  //  2. Name them simply — no spaces. `age7.jpg`, `prom.jpg`, `beach.png`.
  //  3. Set `image` below to "../img/<filename>" for each question.
  //  4. Set `answer` to how old she actually was in that photo.
  //
  //  Photos are shown cropped to portrait and capped so the slider stays on
  //  screen. Resize to roughly 1000px on the long edge first so they load
  //  fast on party wifi. Until a real file is there you'll see a striped
  //  "add a photo" panel — that's expected, not a bug.
  {
    type: "photoage",
    name: "How Old Is She Here?",
    emoji: "📸",
    blurb: "One photo. One guess. Closest wins.",
    duration: 25,
    questions: [
      { image: "../img/photo1.jpg", caption: "Exhibit A", answer: 5,  min: 0, max: 25 },
      { image: "../img/photo2.jpg", caption: "Exhibit B", answer: 12, min: 0, max: 25 },
      { image: "../img/photo3.jpg", caption: "Exhibit C", answer: 17, min: 0, max: 25 },
      { image: "../img/photo4.jpg", caption: "Exhibit D", answer: 21, min: 0, max: 25 },
      // Add as many as you like — each one is its own question.
    ],
  },

  // ── Round 4 ────────────────────────────────────────────────────────
  //  ⚠️ STILL PLACEHOLDER — this is the one round that needs real facts
  //  from you. Swap in five things that actually happened to Michelle, and
  //  list them EARLIEST FIRST. The game shuffles them for players.
  {
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
  //  picked. Feel free to swap in names of people who'll actually be there.
  {
    type: "majority",
    name: "Hive Mind",
    emoji: "🐝",
    blurb: "No right answer — score by picking what MOST of the room picks.",
    duration: 20,
    questions: [
      {
        q: "Who is most likely to be late to Michelle's next party?",
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
    data: resolveImage(question),
  }))
);
