# 🎂 Michelle's 25th — Birthday Party Game

A phone-friendly, multiplayer party game for 8–10 people. One person hosts on
their phone, everyone else joins with a 4-letter room code. Players race across
a leaderboard by winning minigame rounds about the birthday girl.

**Runs entirely on GitHub Pages + the Firebase Realtime Database free tier.**
No server, no build step, no npm install, no cost.

---

## The rounds

| Round | What happens | Scoring |
|---|---|---|
| 🧠 **Trivia** | Multiple choice questions about Michelle (photos supported) | Correct answer + speed bonus |
| 🎈 **Guess the Age** | "How old was she when…?" — slider guess | Closer = more points, exact gets a bonus |
| 📸 **How Old Is She Here?** | A photo of her, then guess her age in it | Same as above — closest takes it |
| 🐝 **What Would Michelle Do?** | No right answer — score by matching what most of the room picked | Match the majority |
| 💬 **Michelle Says** | Her own answers, at **2× points**, so the finale stays open | Everything doubled |
| ⏳ **Chronology** | Tap life events into the order they happened | Partial credit per correctly-ordered pair |
| 🐤 **Flappy Michelle** | Her face, with wings, versus a lot of pipes | Bonus points, ranked by best run |
| 🧠 **Michellorization** | 5×5 grid; memorise where her face is, tap them back | Bonus points, ranked by best run |
| 🏃 **Michelle Surfers** | Three-lane runner. Dodge everything, it speeds up | Bonus points, ranked by best run |

The three 🕹️ arcade rounds are interleaved between the quiz rounds, so the
room gets a physical break between thinking rounds.

⏳ Chronology is currently **parked** (`enabled: false`) pending real dates —
see [Parking a round](#parking-a-round). Everything else is live: **22
questions, roughly 30 minutes.**

Between rounds everyone watches the **🏁 race track** — avatars hop forward by
score. At the end: a podium, full standings, confetti, and joke superlatives.

---

## Setup (about 10 minutes, once)

### 1. Firebase

1. <https://console.firebase.google.com> → **Add project** (name it whatever;
   the config here assumes `michelle-bday`). You can skip Google Analytics.
2. **Build → Realtime Database → Create Database.** Pick a region near you and
   choose **Start in locked mode**.
3. Open the **Rules** tab, paste the entire contents of
   [`database.rules.json`](./database.rules.json), and hit **Publish**.
4. **Build → Authentication → Get started → Anonymous → Enable.**
   *(The game will refuse to start without this — it's how players get an
   identity without making accounts.)*
5. **⚙ Project settings → Your apps → Web (`</>`)** → register an app.
   Copy the `apiKey`, `messagingSenderId`, and `appId` it shows you.

### 2. Paste the keys

Open [`js/config.js`](./js/config.js) and fill in the three `PASTE_…` values.
Also confirm `databaseURL` matches what's shown at the top of your Realtime
Database page — non-US regions use a different domain.

> These keys are **not secrets**. Firebase web keys are public by design; your
> data is protected by the rules in `database.rules.json`. It's fine that they
> sit in a public repo.

### 3. Turn on GitHub Pages

Repo **Settings → Pages → Source: Deploy from a branch**, branch `main`,
folder `/ (root)`. A minute later the game is live at:

```
https://kasai2020.github.io/michelle-birthday/
```

Make a QR code for that URL and stick it on the wall — nobody wants to type it.

---

## Writing the actual questions

**Everything you customise lives in [`data/content.js`](./data/content.js).**
It's plain JavaScript with comments; you don't need to touch anything else.

```js
{
  type: "trivia",
  name: "Michelle 101",
  emoji: "🧠",
  blurb: "The basics. No excuses.",
  duration: 20,        // seconds per question
  multiplier: 1,       // 2 = double points round
  questions: [
    { q: "Her go-to coffee order?",
      options: ["Oat latte", "Black drip", "Matcha", "Cold brew"],
      answer: 0 },     // 0-based index of the right one
  ],
}
```

Round types and their fields:

- **`trivia`** — `q`, `options[]`, `answer` (index), optional `image` (URL)
- **`age`** — `q`, `answer` (number), `min`, `max`, `unit`, optional `image`.
  Works for any number question ("how many countries…"), not just ages.
- **`photoage`** — the photo round. `image`, `answer` (her age in it),
  `caption`, `min`, `max`, and an optional `q` if you want to ask something
  more specific than "how old is she here?". Scoring matches `age`.
  See [`img/README.md`](./img/README.md) for how to add the pictures.
- **`chronology`** — `q`, `items[]` **listed in the correct order**
  (the game shuffles them for players)
- **`majority`** — `q`, `options[]`. No answer key; you score by matching the
  crowd.
- **`arcade`** — a real minigame. Only field is `game`: `"flappy"`,
  `"memory"` or `"surfers"`. Nothing to write. See below.

Add, remove, and reorder rounds freely — the game adapts to whatever's there.
Aim for **15–20 questions total**, which runs about 20–25 minutes.

### Parking a round

Set `enabled: false` on a round to keep it in the file but out of the game:

```js
{ enabled: false, type: "chronology", name: "The Michelle Timeline", … }
```

Round numbering closes up around it, the tests still validate its contents,
and `tests/preview.html` still renders it — so a parked round can't quietly
rot. Delete the line to bring it back.

### The arcade rounds

The three minigames live in [`js/minigames/`](./js/minigames/). Each one is a
single file exporting `mount(container, { face, onEnd })`, plus a `label()` for
formatting its score and an `instructions` string — the shared countdown,
retries, scoring and lock-in button all live in
[`js/rounds/arcade.js`](./js/rounds/arcade.js), so a new minigame is one file
and one line in the registry.

Design notes worth keeping if you tweak them:

- **Retries are unlimited** until the round timer ends, and your *best* run
  counts. One-shot runs punish whoever dies in two seconds, which at a party
  is exactly the person who needs the round to be fun.
- **There's always a way out.** A "Sit this one out" / "Lock in" button stays
  on screen even mid-run, so nobody is trapped in a game they don't want.
- **Flappy is tuned far gentler than the original** — wider gaps, slower
  pipes, softer gravity. A round where everyone scores 0 isn't a round.
- **Winning a minigame is worth about one good trivia answer** (see
  `SCORING.arcade`). They're a garnish; the quiz still decides the game.
- They all use `img/face.jpg`, a square crop generated from one of the photos.

### Adding photos

Upload images to the [`img/`](./img/) folder, then point a question at one:

```js
{ image: "../img/photo1.jpg", caption: "Exhibit A", answer: 5, min: 0, max: 25 },
```

Paths are resolved relative to `data/content.js`, so `../img/…` works whether
the game is opened at the site root or from `tests/preview.html`. Full
`https://` URLs work too. Resize to ~1000px on the long edge first so they
load fast on party wifi — and note that anything in `img/` is served
publicly. Full guide: [`img/README.md`](./img/README.md).

---

## Running it on the night

1. You open the site and tap **Host a game**. A 4-letter code appears.
2. Everyone else opens the site, types their name, taps **Join a game**, enters
   the code. They appear in your lobby as they arrive.
3. Tap **Start the game**. You control the pacing with the **Next ▸** button —
   the room follows your screen.
4. Questions auto-advance when the timer runs out *or* when everyone has
   answered, whichever comes first.

**Your phone is the referee.** It scores every question and drives every
transition, so keep it awake and don't close the tab. Players can refresh,
lose signal, or arrive late without losing their score — but if the *host*
leaves, the game stalls.

**Latecomers** can join mid-game at any time; they start at 0 points.

---

## Local development

```bash
python3 -m http.server 8000     # any static server works
open http://localhost:8000
```

Two offline helpers, neither of which needs Firebase:

```bash
node tests/scoring.test.mjs     # scoring rules + validates data/content.js
open http://localhost:8000/tests/preview.html   # every screen with fake data
```

`tests/scoring.test.mjs` is worth running after you edit `content.js` — it
catches typos like an `answer` index pointing past the end of `options`.

To check the security rules, run them against the Firebase emulator:

```bash
npm i -D firebase-tools firebase @firebase/rules-unit-testing
npx firebase emulators:start --only database --project michelle-bday
node tests/rules.test.mjs       # in a second terminal
```

27 assertions covering who may read the answer pile, who may set scores, and
what a guest with devtools open can and can't do.

---

## Data model

```
rooms/{CODE}
  hostId                        uid of the referee — grants write access
  state                         { phase, step, sub, startedAt, endsAt }
  players/{uid}                 { name, avatar, score, online }
  answers/{step}/{uid}          { v, t }        ← host-readable only
  locked/{step}/{uid}           true            ← everyone reads: who's ready
  results/{step}                { answer, tally, players:{uid:{pts,ok}} }
```

A round ends when every player has *locked in* — an explicit act, not just
"has something saved" — or when the timer runs out. Partial answers are saved
continuously so a timeout still scores what you had, but they can't end the
round early.

`phase` walks through `lobby → intro → question → reveal → race → … → final`.
Countdowns are computed from Firebase's server clock, so phones with drifting
clocks stay in sync.

The rules enforce that a player can only ever write their **own** answer and
their own name/avatar/presence. Only the host can write `state`, `results`,
and anyone's `score` — so a guest with devtools open can't award themselves
points. `rooms/{CODE}` itself is deliberately unreadable; that's what keeps
the answer pile visible to the host alone while a question is live.

The rules file can't carry comments — Firebase treats any key that isn't
`.read`/`.write`/`.validate`/`.indexOn` as a child path and rejects the file.

### Free-tier headroom

A 10-player, 20-question game moves a few hundred KB. The free Spark plan
allows 1 GB stored and 10 GB/month transferred — you'd need to run this party
several thousand times to notice.

---

## Ideas for more rounds

Cheap to add with the existing round types:

- **Photo rounds** — "where was this taken?", "what year is this?", "guess the
  age from this photo" (`trivia`/`age` with an `image`)
- **Finish her sentence** — trivia where the options are all things she says
- **Two truths and a lie** — trivia, "which one is fake?"
- **Michelle Says** — get her answers in advance, then ask the room to predict
  them (`trivia` where the answer key is hers)
- **Most likely to…** — `majority`, guaranteed arguing
- **Price is Right** — `age` round on the cost of her most questionable purchase
- **How many…** — `age` round: shoes owned, countries visited, times she's
  rewatched a comfort show

Needing a bit of new code (each is a new module in `js/rounds/`):

- **Audio round** — snippets of her most-played songs
- **Emoji story** — decode 🍕🚗🌊 into a story from her life
- **Charades / Pictionary interlude** — an off-phone round where the host just
  awards points manually
- **Wager round** — bet a chunk of your score before seeing the question

Off-screen games that pair well with this between rounds: a slideshow of
guesses about "Michelle at 30", a group toast where each person has to top the
previous compliment, or a "guess who wrote this birthday message" reveal.
