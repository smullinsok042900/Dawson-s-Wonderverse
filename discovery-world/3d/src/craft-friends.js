// The next collection of family artwork, with one streamed home for every intended figure.
// Models stay reusable; their destination comes from the same list used by the map guide and interaction tour.
import { CRAFT_ANIMALS } from './craft-animals.js';
import { CRAFT_FANTASY } from './craft-fantasy.js';
import { CRAFT_COLORING } from './craft-coloring.js';
import { CRAFT_FRIEND_HOMES } from './craft-friend-homes.js';

const homes = new Map(CRAFT_FRIEND_HOMES.map(home => [home.kind, home]));
export const CRAFT_FRIENDS = Object.fromEntries(Object.entries({ ...CRAFT_ANIMALS, ...CRAFT_FANTASY, ...CRAFT_COLORING })
  .map(([kind, species]) => [kind, { ...species, planet: homes.get(kind).planet }]));
