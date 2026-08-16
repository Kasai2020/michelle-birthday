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
| ⏳ **Chronology** | Tap life events into the order they happened | Partial credit per correctly-ordered pair |
| 🐝 **Hive Mind** | No right answer — score by matching what most of the room picked | Match the majority |
| 💥 **Sudden Death** | Trivia at **2× points** so the finale stays open | Everything doubled |

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
- **`chronology`** — `q`, `items[]` **listed in the correct order**
  (the game shuffles them for players)
- **`majority`** — `q`, `options[]`. No answer key; you score by matching the
  crowd.

Add, remove, and reorder rounds freely — the game adapts to whatever's there.
Aim for **15–20 questions total**, which runs about 20–25 minutes.

### Adding photos

Commit images to an `img/` folder and reference them by raw URL:

```js
image: "https://raw.githubusercontent.com/Kasai2020/michelle-birthday/main/img/beach.jpg"
```

Resize them to ~1000px wide first so they load fast on party wifi.

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

---

## Data model

```
rooms/{CODE}
  hostId                        uid of the referee — grants write access
  state                         { phase, step, sub, startedAt, endsAt }
  players/{uid}                 { name, avatar, score, online }
  answers/{step}/{uid}          { v, t }        ← host-readable only
  results/{step}                { answer, tally, players:{uid:{pts,ok}} }
```

`phase` walks through `lobby → intro → question → reveal → race → … → final`.
Only the host writes `state`, `results`, and other players' scores; a player
can only write their own answer. Countdowns are computed from Firebase's
server clock, so phones with drifting clocks stay in sync.

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
