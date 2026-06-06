export const WORD_BANK: Record<string, { word: string; hint: string }[]> = {
  Animals: [
    { word: "DOLPHIN", hint: "Lives in the ocean, very intelligent, communicates with sounds" },
    { word: "PENGUIN", hint: "A bird that cannot fly and lives in cold climates" },
    { word: "CHAMELEON", hint: "A reptile known for changing its appearance" },
    { word: "KANGAROO", hint: "A marsupial from Australia with a pouch" },
    { word: "OCTOPUS", hint: "Sea creature with eight limbs, very intelligent" },
    { word: "CHEETAH", hint: "The fastest land animal on Earth" },
    { word: "FLAMINGO", hint: "A large pink wading bird that stands on one leg" },
  ],
  Food: [
    { word: "SUSHI", hint: "A Japanese dish, often involves raw ingredients on rice" },
    { word: "AVOCADO", hint: "A green fruit, creamy inside, used in guacamole" },
    { word: "CROISSANT", hint: "A buttery, flaky pastry from France, crescent-shaped" },
    { word: "RAMEN", hint: "A Japanese noodle soup, hot, often with broth" },
    { word: "TRUFFLE", hint: "A luxury fungus found underground, very expensive" },
    { word: "MANGO", hint: "A tropical fruit, sweet and orange inside" },
    { word: "PRETZEL", hint: "A baked snack, twisted into a knot shape, salty" },
  ],
  Objects: [
    { word: "TELESCOPE", hint: "A device used to look at objects very far away" },
    { word: "COMPASS", hint: "A tool used for navigation, points to the north" },
    { word: "HOURGLASS", hint: "A timer device using sand to measure time" },
    { word: "MICROSCOPE", hint: "Used to see very small things not visible to the eye" },
    { word: "TYPEWRITER", hint: "An old machine used to write text on paper" },
    { word: "KALEIDOSCOPE", hint: "A tube with mirrors that creates colorful patterns" },
    { word: "THERMOMETER", hint: "A device that measures temperature" },
  ],
  Places: [
    { word: "COLOSSEUM", hint: "A famous ancient arena in Italy, used for combat" },
    { word: "AMAZON", hint: "The world's largest rainforest, also a giant river" },
    { word: "SAHARA", hint: "The world's largest hot desert, in Africa" },
    { word: "ANTARCTICA", hint: "The coldest continent on Earth, no native human population" },
    { word: "VERSAILLES", hint: "A famous French palace with magnificent gardens" },
    { word: "SILICON VALLEY", hint: "A region in California known for tech companies" },
    { word: "STONEHENGE", hint: "An ancient stone monument in England" },
  ],
  Professions: [
    { word: "SOMMELIER", hint: "An expert in wine, works in restaurants" },
    { word: "TAXIDERMIST", hint: "Someone who preserves and mounts dead animals" },
    { word: "ACTUARY", hint: "A professional who calculates financial risks using math" },
    { word: "LOCKSMITH", hint: "A person who works with locks and keys" },
    { word: "CARTOGRAPHER", hint: "A person who makes and studies maps" },
    { word: "INTERPRETER", hint: "Someone who translates spoken language in real time" },
    { word: "ARCHAEOLOGIST", hint: "Studies human history by excavating ancient sites" },
  ],
  Plants: [
    { word: "BAMBOO", hint: "The fastest-growing plant on Earth, used in construction" },
    { word: "VENUS FLYTRAP", hint: "A plant that captures and eats insects" },
    { word: "CACTUS", hint: "A plant that stores water and has sharp spines" },
    { word: "ORCHID", hint: "An exotic flower prized for its beauty and diversity" },
    { word: "MANGROVE", hint: "A tree that grows in coastal saltwater environments" },
    { word: "LOTUS", hint: "A sacred aquatic flower that grows in muddy water" },
    { word: "BAOBAB", hint: "A massive tree with a thick trunk, native to Africa" },
  ],
};

export const CATEGORIES = Object.keys(WORD_BANK);

export function pickRandomWord() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const words = WORD_BANK[category];
  const entry = words[Math.floor(Math.random() * words.length)];
  return { category, word: entry.word, hint: entry.hint };
}

const NICKNAMES = [
  "GhostFox", "NeonWolf", "CryptoViper", "ShadowByte", "QuantumSage",
  "VoidRaven", "CyberLynx", "DataPhantom", "SpectralAce", "IronMask",
  "NullPulse", "NovaGhost", "SilentComet", "CipherWolf", "VectorShade",
];

const MOCK_PLAYER_NAMES = ["GhostFox", "NeonWolf", "CryptoViper", "ShadowByte"];

export function generateMockPlayers(
  hostId: string,
  hostName: string,
  maxPlayers: number
): import("./types").Player[] {
  const count = Math.floor(Math.random() * (maxPlayers - 2)) + 2; // 2 to maxPlayers-1 more players
  const mockPlayers = MOCK_PLAYER_NAMES.slice(0, Math.min(count, maxPlayers - 1));

  return [
    {
      id: hostId,
      name: hostName,
      isHost: true,
      isReady: true,
      isEliminated: false,
      isImpostor: false,
      hasSubmittedThisRound: false,
    },
    ...mockPlayers.map((name, i) => ({
      id: `bot-${i}`,
      name,
      isHost: false,
      isReady: Math.random() > 0.3,
      isEliminated: false,
      isImpostor: false,
      hasSubmittedThisRound: false,
    })),
  ];
}

export const DEMO_CLUES: string[][] = [
  ["Ocean", "Smart", "Leaps", "Echo"],
  ["Waves", "Playful", "Sonar", "Fins"],
  ["Blue", "Swim", "Fast", "Pod"],
];
