// (build 130) Dawson and her family as round toy characters, from the family's pictures (the photographs are not in the
// game: only their colours, hair, glasses and clothes). They live together on the Adventure Trail and greet her by name.
import { person, resident, dog } from './story-friends.js';

const fam = (name, voice, o, action, line, colors, extra = {}) => resident(name, voice, b => person(b, o), action, line, colors, 'hop', { emoji: '⭐', v: .4, r: .8, ...extra });

export const FAMILY = {
  famdawson: fam('Dawson', 'Hi! I am Dawson! Do you want to play superheroes with me?', { skin: '#f6d6c4', hair: '#a8835a', style: 'pony', top: '#22202a', bottom: '#b44a46', legs: '#b44a46', shoes: '#c49a6c', iris: '#5a6a72', lips: '#e07a8a', figures: true }, 'bounce', 'Super jump! Heroes save the day!', ['#e3344a', '#2f5fa8'], { size: .72 }),
  famdad: fam('Dad', 'Hi Dawson! It is Dad! I love you so much!', { skin: '#efc2a2', hair: '#c9944f', style: 'short', top: '#6a2433', bottom: '#8a8d94', legs: '#8a8d94', shoes: '#3a3a44', beard: '#b07a42', bigBeard: true, iris: '#5a6a72', lips: '#c07070' }, 'hug', 'A big Dad bear hug!', ['#6a2433', '#8a8d94'], { size: 1.12 }),
  fammom: fam('Mom', 'Hi Dawson! It is Mom! Let’s color a picture together!', { skin: '#f0cfb8', hair: '#2c2224', style: 'long', top: '#1e1c24', jacket: '#6e2230', bottom: '#b9bcc4', legs: '#b9bcc4', shoes: '#c49a6c', glasses: '#e8eef4', iris: '#4a3a30', lips: '#d27a8a', book: true }, 'sparkle', 'Coloring sparkles! I love you!', ['#6e2230', '#b9bcc4']),
  famayla: fam('Aunt Ayla', 'Hi Dawson! It is Aunt Ayla! Let’s twirl together!', { skin: '#f6d2bc', hair: '#d9a55a', style: 'long', top: '#c9a3ea', gown: '#c9a3ea', jacket: '#a6e3d9', iris: '#6a8aa0', lips: '#d98a9a' }, 'twirl', 'Twirl, twirl! You are the best!', ['#c9a3ea', '#a6e3d9']),
  famgigi: fam('Gigi', 'Hello Dawson! It is Gigi! Come give me a hug!', { skin: '#f0c8aa', hair: '#4a3628', style: 'short', top: '#7ea6cc', gown: '#efe6da', shoes: '#2a2a30', iris: '#5a4a3a', lips: '#c86a7a' }, 'hug', 'A big Gigi hug!', ['#7ea6cc', '#efe6da']),
  famgrandpa: fam('Grandpa', 'Hi Dawson! It is Grandpa! Let’s go on an adventure!', { skin: '#eec4a6', hair: '#2a2426', style: 'slick', top: '#9cc4e8', jacket: '#1f2f45', bottom: '#2a3f6a', legs: '#2a3f6a', shoes: '#26262c', glasses: '#26262c', beard: '#6a5a52', iris: '#5a4a3a', lips: '#b0707a' }, 'bounce', 'Adventure time! Hooray!', ['#1f2f45', '#9cc4e8'], { size: 1.08 }),
  fambuck: dog('Buck the Dog', 'Woof woof! I am Buck! I love you, Dawson!', { coat: '#c99a62', belly: '#ecd2a8', ear: '#2a2420', earType: 'flop', mask: '#3a302a', len: 1.15, legH: .2, collar: '#ff8fc0', tailTip: '#f4ead8', spots: [[0, .56, -.08, .17, '#2e2a28']] }, 'bounce', 'Woof! Buck wants to play fetch!'),
};

// they live together on the Adventure Trail (checked against every activity and every older friend by tests/family.test.mjs)
export const FAMILY_HOMES = [
  { kind: 'famdawson', district: 'trail', x: 517.8, z: -3.9 },
  { kind: 'fammom', district: 'trail', x: 516.2, z: -4.4 },
  { kind: 'famdad', district: 'trail', x: 519.6, z: -4.4 },
  { kind: 'fambuck', district: 'trail', x: 521.3, z: -3.8 },
  { kind: 'famayla', district: 'trail', x: 514.5, z: -4.0 },
  { kind: 'famgigi', district: 'trail', x: 527, z: -4.3 },
  { kind: 'famgrandpa', district: 'trail', x: 531.5, z: -4.0 },
];
