/**
 * Class-name helpers shared by the page components.
 */

/**
 * The glow that belongs to an icon chip.
 *
 * A card that carries a chip glows in that chip's colour, so the light on the
 * card, the icon and the figure are all one colour instead of the card glowing
 * one hue while its contents are another. Deriving it from the chip rather than
 * writing it out beside the chip means the two cannot drift apart — the way a
 * hand-kept second field always eventually does.
 *
 * An unknown chip falls back to `card-glow` alone, which glows the default
 * blue, rather than to a `card-glow-x` class that does not exist.
 */
export function glowOf(chip) {
  if (typeof chip !== 'string' || !chip.startsWith('chip-')) return 'card-glow';
  const tone = chip.slice('chip-'.length);
  return TONES.has(tone) ? `card-glow-${tone}` : 'card-glow';
}

/** The tones `card-glow-*` and `chip-*` are defined for, in globals.css. */
const TONES = new Set(['g', 'y', 'p', 'b', 'r', 'n', 'o']);

/**
 * Mining and investment tiers are named after metals, so they are coloured by
 * their name — Silver really is silver, Gold really is gold, Bronze is the
 * copper-orange of bronze rather than a second yellow. The three tiers past
 * Diamond (`Elite`, `Institutional`, `Whale`) are not metals and have nothing
 * to match, so they take the remaining tones in an order that keeps every row
 * of a three-column grid free of repeats: platinum/diamond/elite read purple,
 * blue, green and institutional/whale read purple, red.
 */
const NAMED_TONES = {
  Starter: 'g',
  Bronze: 'o',
  Silver: 'n',
  Gold: 'y',
  Platinum: 'p',
  Diamond: 'b',
  Elite: 'g',
  Institutional: 'p',
  Whale: 'r',
};

/**
 * The tone a tier card wears. `index` catches anything unnamed — a new tier
 * someone adds without touching this file still gets a colour of its own
 * rather than falling back to the default blue with all its neighbours.
 */
export function tierTone(name, index = 0) {
  return NAMED_TONES[name] || ['g', 'b', 'p', 'y'][index % 4];
}

/** The glow class for a tier card, by name and then by position. */
export function tierGlow(name, index = 0) {
  return `card-glow-${tierTone(name, index)}`;
}

/** The icon-chip class matching a tone, so chip and glow cannot disagree. */
export function toneChip(name, index = 0) {
  return `chip-${tierTone(name, index)}`;
}
