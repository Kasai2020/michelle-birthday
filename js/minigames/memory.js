// 🧠 MICHELLORIZATION — a 5×5 grid. Some cards have her face. Memorise
// where, watch them flip, then tap them back out. One wrong tap ends it.
//
// Score = faces found before the mistake.
//
// Six faces in twenty-five cards is deliberately above most people's memory
// span. Nobody is expected to clear it — the partial score is the game.

import { el, shuffled } from "../ui.js";

const SIZE   = 5;
const FACES  = 6;
const STUDY  = 4200;   // ms the faces stay visible

export const label = (n) => `${n}/${FACES} found`;
export const instructions = `Memorise where her face is, then tap all ${FACES} back. One miss ends the run.`;

export function mount(container, { onEnd }) {
  const cells = SIZE * SIZE;
  const faceAt = new Set(shuffled([...Array(cells).keys()]).slice(0, FACES));
  const found = new Set();
  let phase = "study";   // study → play → over
  let ended = false;

  const status = el("div.mg-status", {}, "Memorise…");
  const grid = el("div.mg-grid");
  const wrap = el("div.mg-stage", {}, status, grid);
  container.append(wrap);

  const finish = () => {
    if (ended) return;
    ended = true;
    phase = "over";
    clearTimeout(studyTimer);
    paint();
    setTimeout(() => { if (container.isConnected) onEnd(found.size); }, 550);
  };

  const tap = (i) => {
    if (phase !== "play") return;
    if (found.has(i)) return;
    if (faceAt.has(i)) {
      found.add(i);
      status.textContent = `${found.size} / ${FACES}`;
      paint();
      if (found.size === FACES) finish();
    } else {
      status.textContent = "Wrong one!";
      paint(i);
      finish();
    }
  };

  function paint(wrongIdx = -1) {
    grid.replaceChildren(...Array.from({ length: cells }, (_, i) => {
      const isFace = faceAt.has(i);
      const revealed =
        phase === "study" ? isFace
        : phase === "over" ? isFace || i === wrongIdx
        : found.has(i);

      const cls = [
        revealed && isFace ? "face" : "",
        i === wrongIdx ? "wrong" : "",
        phase === "over" && isFace && !found.has(i) ? "missed" : "",
      ].filter(Boolean).join(" ");

      return el("button.mg-card", {
        type: "button",
        class: cls,
        disabled: phase !== "play",
        onclick: () => tap(i),
      }, revealed && isFace ? el("img", { src: FACE_SRC, alt: "" }) : "");
    }));
  }

  const FACE_SRC = new URL("../../img/face.jpg", import.meta.url).href;
  paint();

  const studyTimer = setTimeout(() => {
    if (!container.isConnected) return;
    phase = "play";
    status.textContent = `0 / ${FACES}`;
    paint();
  }, STUDY);

  return () => { ended = true; clearTimeout(studyTimer); };
}
