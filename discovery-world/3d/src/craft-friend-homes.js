// NEXT batch staging: thirty residents from twenty-seven unique reference photos.
// The pumpkin/ghost sheet yields two friends; the three-bee sheet yields three.
// Planet x is an offset from the planet's start (k.X), never from k.s0.
// Positive planet z keeps these small residents on the front roadside, clear of the big attraction structures.
// New homes are deliberately absent from Jupiter's busy playground and Earth's crowded Trail/Woods.
export const CRAFT_FRIEND_HOMES = [
  { kind: 'craftorangescribble', planet: 'earth', district: 'artplaza', x: 850, z: -3.6, source: 'IMG_2354.HEIC', landmark: 'Between the rainbow xylophone and the colored light-mixing buttons.' },
  { kind: 'craftgreenscribble', planet: 'earth', district: 'labgarden', x: 737, z: -4.0, source: 'IMG_2355.HEIC', landmark: 'Between the little launching rocket and the row of water fountains.' },
  { kind: 'craftdadduck', planet: 'earth', district: 'pier', x: -632, z: -3.8, approach: 1, source: 'IMG_2356.HEIC', landmark: 'Between the treasure digging spot and the sailboat, beside the path.' },
  { kind: 'craftbeeorange', planet: 'earth', district: 'farm', x: -409, z: -3.6, source: 'IMG_2352.HEIC', landmark: 'At the snowy end of Happy Farm, before the big red barn.' },
  { kind: 'craftbeepurple', planet: 'earth', district: 'farm', x: -507, z: -2.9, source: 'IMG_2352.HEIC', landmark: 'Between the windmill and the duck pond.' },
  { kind: 'craftbeepale', planet: 'earth', district: 'labgarden', x: 701, z: -3.6, approach: 1, source: 'IMG_2352.HEIC', landmark: 'Between the bubble fountain and the lamp that makes animal shadows.' },

  { kind: 'craftseatedpanda', planet: 'moon', x: 111, z: .8, source: 'IMG_2362.HEIC', landmark: 'At the start of Crater Valley, before the little rocket sign and the giant crater.' },
  { kind: 'craftstandingpanda', planet: 'moon', x: 229, z: .8, source: 'IMG_2363.HEIC', landmark: 'At the start of Moon Mountains, just before the big climbing steps.' },
  { kind: 'craftbonepanda', planet: 'moon', x: 282, z: .8, source: 'IMG_2366.HEIC', landmark: 'In front of the shape-sorting rocks, before the moon buggy.' },

  { kind: 'craftyellowcat', planet: 'mercury', x: 119, z: .8, source: 'IMG_2361.HEIC', landmark: 'Between the little rocket sign and the striped entrance to the mirror maze.' },
  { kind: 'craftorangefox', planet: 'mercury', x: 167, z: .8, approach: 1, source: 'IMG_2359.HEIC', landmark: 'Along the front of the mirror maze, between the middle and last mirror doors.' },
  { kind: 'craftcrownpuppy', planet: 'mercury', x: 309, z: .9, approach: 1, source: 'IMG_2367.HEIC', landmark: 'Past the tiny crawl tunnel, before the tall tower with the Big Top Slide.' },

  { kind: 'craftpatchpuppy', planet: 'mars', x: 112, z: .8, source: 'IMG_2360.HEIC', landmark: 'At the start of Canyon Country, before the big red climbing steps.' },
  { kind: 'craftheartleopard', planet: 'mars', x: 152, z: .8, source: 'IMG_2369.HEIC', landmark: 'Past the canyon rocks and before the row of little colored rocks and bounce pads.' },
  { kind: 'craftheadphonedragon', planet: 'mars', x: 229, z: .8, source: 'IMG_2370.HEIC', landmark: 'At the start of the explorer station, between the little rocket sign and the white domes.' },

  { kind: 'craftrainbowcorgi', planet: 'venus', x: 120, z: .8, source: 'IMG_2358.HEIC', landmark: 'Before the boarding platform for the giant log ride.' },
  { kind: 'craftbutterflyunicorn', planet: 'venus', x: 215, z: .8, source: 'IMG_2345.HEIC', landmark: 'Along the front of the far end of the log ride, beneath its high return bend.' },
  { kind: 'craftflowerpegasus', planet: 'venus', x: 270, z: .8, source: 'IMG_2350.HEIC', landmark: 'Among the sunset rocks beyond the log ride, between the cloud kitten and the sunset butterfly.' },

  { kind: 'craftsweetraccoon', planet: 'saturn', x: 120, z: .8, source: 'IMG_2365.HEIC', landmark: 'Between the little rocket sign and the tall Star Blaster tower.' },
  { kind: 'craftcloudmonkey', planet: 'saturn', x: 195, z: .8, source: 'IMG_2368.HEIC', landmark: 'Past the Star Blaster tower, on the way to the Ring Raceway.' },
  { kind: 'craftpartykitten', planet: 'saturn', x: 275, z: .8, source: 'IMG_2349.HEIC', landmark: 'Past the Ring Raceway launch kart, with the giant ringed planet behind you.' },

  { kind: 'craftbuttonbunny', planet: 'uranus', x: 120, z: .8, source: 'IMG_2364.HEIC', landmark: 'Before the ice castle steps, just past the little rocket sign.' },
  { kind: 'craftbluemanepony', planet: 'uranus', x: 170, z: .8, source: 'IMG_2347.HEIC', landmark: 'Between the ice castle and the Ice Palace entrance.' },
  { kind: 'craftpinkpony', planet: 'uranus', x: 227, z: .8, source: 'IMG_2348.HEIC', landmark: 'Past the palace slide, before the moon-marked ice tunnel and the skating rink.' },

  { kind: 'craftscribbleshark', planet: 'neptune', x: 120, z: .8, source: 'IMG_2353.HEIC', landmark: 'Beside the windsock, before the wind-powered swing set.' },
  { kind: 'craftbucketghost', planet: 'neptune', x: 207, z: .8, source: 'IMG_2357.HEIC', landmark: 'Past the bungee tower and its landing mat, toward the skydiving area.' },
  { kind: 'craftwingedbow', planet: 'neptune', x: 271, z: .8, source: 'IMG_2346.HEIC', landmark: 'Between the skydiving wind chamber and the big diving balloon.' },

  { kind: 'craftnoodleunicorn', planet: 'pluto', x: 120, z: .8, source: 'IMG_2344.HEIC', landmark: 'Before the first pink bounce castle, just past the little rocket sign.' },
  { kind: 'craftheartpumpkin', planet: 'pluto', x: 170, z: .8, source: 'IMG_2351.HEIC', landmark: 'Between the blue bounce castle and the biggest yellow bounce castle.' },
  { kind: 'craftheartghost', planet: 'pluto', x: 283, z: .8, source: 'IMG_2351.HEIC', landmark: 'Past the soft climbing wall, in front of the giant inflatable slide.' },
];
