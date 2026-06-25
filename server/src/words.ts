// Word bank owned by the server (authoritative).
// Categories are stable keys (translated client-side). Words are Polish.
// The impostor hint is a single word that is only obliquely/loosely related to
// the secret word — a vague nudge in the right neighbourhood, never a direct
// description. It should let the impostor bluff without handing them the answer.

export const WORD_BANK: Record<string, { word: string; hint: string }[]> = {
  animals: [
    { word: "DELFIN", hint: "Akrobata" },
    { word: "PINGWIN", hint: "Frak" },
    { word: "KAMELEON", hint: "Maskarada" },
    { word: "KANGUR", hint: "Boks" },
    { word: "OŚMIORNICA", hint: "Atrament" },
    { word: "GEPARD", hint: "Pościg" },
    { word: "FLAMING", hint: "Balet" },
  ],
  food: [
    { word: "SUSHI", hint: "Pałeczki" },
    { word: "AWOKADO", hint: "Toast" },
    { word: "CROISSANT", hint: "Półksiężyc" },
    { word: "RAMEN", hint: "Para" },
    { word: "TRUFLA", hint: "Świnia" },
    { word: "MANGO", hint: "Słońce" },
    { word: "PRECEL", hint: "Węzeł" },
  ],
  objects: [
    { word: "TELESKOP", hint: "Daleko" },
    { word: "KOMPAS", hint: "Zgubiony" },
    { word: "KLEPSYDRA", hint: "Przemijanie" },
    { word: "MIKROSKOP", hint: "Szczegół" },
    { word: "MASZYNA DO PISANIA", hint: "Retro" },
    { word: "KALEJDOSKOP", hint: "Symetria" },
    { word: "TERMOMETR", hint: "Gorączka" },
  ],
  places: [
    { word: "KOLOSEUM", hint: "Lew" },
    { word: "AMAZONIA", hint: "Tlen" },
    { word: "SAHARA", hint: "Miraż" },
    { word: "ANTARKTYDA", hint: "Cisza" },
    { word: "WERSAL", hint: "Lustro" },
    { word: "DOLINA KRZEMOWA", hint: "Garaż" },
    { word: "STONEHENGE", hint: "Zagadka" },
  ],
  professions: [
    { word: "SOMELIER", hint: "Nos" },
    { word: "TAKSYDERMISTA", hint: "Trofeum" },
    { word: "AKTUARIUSZ", hint: "Tabela" },
    { word: "ŚLUSARZ", hint: "Awaria" },
    { word: "KARTOGRAF", hint: "Granica" },
    { word: "TŁUMACZ", hint: "Most" },
    { word: "ARCHEOLOG", hint: "Pył" },
  ],
  plants: [
    { word: "BAMBUS", hint: "Panda" },
    { word: "MUCHOŁÓWKA", hint: "Pułapka" },
    { word: "KAKTUS", hint: "Wytrwałość" },
    { word: "ORCHIDEA", hint: "Elegancja" },
    { word: "NAMORZYN", hint: "Błoto" },
    { word: "LOTOS", hint: "Medytacja" },
    { word: "BAOBAB", hint: "Wiek" },
  ],
};

const CATEGORIES = Object.keys(WORD_BANK);

export function pickRandomWord() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const words = WORD_BANK[category];
  const entry = words[Math.floor(Math.random() * words.length)];
  return { category, word: entry.word, hint: entry.hint };
}
