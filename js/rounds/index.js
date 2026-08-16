// Registry mapping a round `type` from data/content.js to its module.
// To invent a new minigame: write a module exporting render/score/reveal,
// then add it here.

import * as trivia     from "./trivia.js";
import * as age        from "./age.js";
import * as photoage   from "./photoage.js";
import * as chronology from "./chronology.js";
import * as majority   from "./majority.js";

export const ROUND_TYPES = { trivia, age, photoage, chronology, majority };

export const roundModule = (type) => ROUND_TYPES[type] || trivia;
