import singleCharBlack from './single-char-black.js';
import singleCharRed from './single-char-red.js';
import doubleLineRed from './double-line-red.js';
import poetryVertical from './poetry-vertical.js';
import verticalWhite from './vertical-white.js';

export const templates = [
  singleCharBlack,
  singleCharRed,
  doubleLineRed,
  poetryVertical,
  verticalWhite,
];

export function getTemplate(id) {
  return templates.find((t) => t.id === id) ?? null;
}
