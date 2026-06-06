// Word bank owned by the server (authoritative).
// Categories are stable keys (translated client-side). Words are Polish.
// The impostor hint is a single evocative word.

export const WORD_BANK: Record<string, { word: string; hint: string }[]> = {
  animals: [
    { word: "DELFIN", hint: "Ocean" },
    { word: "PINGWIN", hint: "Lód" },
    { word: "KAMELEON", hint: "Kolory" },
    { word: "KANGUR", hint: "Australia" },
    { word: "OŚMIORNICA", hint: "Macki" },
    { word: "GEPARD", hint: "Szybkość" },
    { word: "FLAMING", hint: "Róż" },
  ],
  food: [
    { word: "SUSHI", hint: "Japonia" },
    { word: "AWOKADO", hint: "Guacamole" },
    { word: "CROISSANT", hint: "Francja" },
    { word: "RAMEN", hint: "Zupa" },
    { word: "TRUFLA", hint: "Luksus" },
    { word: "MANGO", hint: "Tropik" },
    { word: "PRECEL", hint: "Sól" },
  ],
  objects: [
    { word: "TELESKOP", hint: "Gwiazdy" },
    { word: "KOMPAS", hint: "Północ" },
    { word: "KLEPSYDRA", hint: "Piasek" },
    { word: "MIKROSKOP", hint: "Drobne" },
    { word: "MASZYNA DO PISANIA", hint: "Litery" },
    { word: "KALEJDOSKOP", hint: "Wzory" },
    { word: "TERMOMETR", hint: "Temperatura" },
  ],
  places: [
    { word: "KOLOSEUM", hint: "Rzym" },
    { word: "AMAZONIA", hint: "Dżungla" },
    { word: "SAHARA", hint: "Pustynia" },
    { word: "ANTARKTYDA", hint: "Mróz" },
    { word: "WERSAL", hint: "Pałac" },
    { word: "DOLINA KRZEMOWA", hint: "Technologia" },
    { word: "STONEHENGE", hint: "Kamienie" },
  ],
  professions: [
    { word: "SOMELIER", hint: "Wino" },
    { word: "TAKSYDERMISTA", hint: "Wypychanie" },
    { word: "AKTUARIUSZ", hint: "Ryzyko" },
    { word: "ŚLUSARZ", hint: "Klucze" },
    { word: "KARTOGRAF", hint: "Mapy" },
    { word: "TŁUMACZ", hint: "Języki" },
    { word: "ARCHEOLOG", hint: "Wykopaliska" },
  ],
  plants: [
    { word: "BAMBUS", hint: "Wzrost" },
    { word: "MUCHOŁÓWKA", hint: "Owady" },
    { word: "KAKTUS", hint: "Kolce" },
    { word: "ORCHIDEA", hint: "Kwiat" },
    { word: "NAMORZYN", hint: "Korzenie" },
    { word: "LOTOS", hint: "Woda" },
    { word: "BAOBAB", hint: "Drzewo" },
  ],
};

const CATEGORIES = Object.keys(WORD_BANK);

export function pickRandomWord() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const words = WORD_BANK[category];
  const entry = words[Math.floor(Math.random() * words.length)];
  return { category, word: entry.word, hint: entry.hint };
}
