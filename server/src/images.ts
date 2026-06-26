// Image bank for "obraz" (image) mode — the crew is shown a painting and each
// player describes it in one word, while the impostor never sees it and has to
// blend in. All entries are public-domain artworks served by Wikimedia Commons
// via the stable Special:FilePath redirect (?width=1000 returns a sized thumb).
// Every URL below was verified to exist against the Commons API. The category is
// the painting's genre — it's the only crumb the impostor gets, as a weak hint.

export interface ImageEntry {
  url: string;
  /** genre key, translated client-side (portrait | landscape | scene | abstract | stilllife) */
  category: string;
}

export const IMAGE_BANK: ImageEntry[] = [
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mona%20Lisa%2C%20by%20Leonardo%20da%20Vinci%2C%20from%20C2RMF%20retouched.jpg?width=1000", category: "portrait" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Van%20Gogh%20-%20Starry%20Night%20-%20Google%20Art%20Project.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Grant%20Wood%20-%20American%20Gothic%20-%20Google%20Art%20Project.jpg?width=1000", category: "portrait" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Edvard%20Munch%2C%201893%2C%20The%20Scream%2C%20oil%2C%20tempera%20and%20pastel%20on%20cardboard%2C%2091%20x%2073%20cm%2C%20National%20Gallery%20of%20Norway.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Girl%20with%20a%20Pearl%20Earring.jpg?width=1000", category: "portrait" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tsunami%20by%20hokusai%2019th%20century.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Caspar%20David%20Friedrich%20-%20Wanderer%20above%20the%20Sea%20of%20Fog.jpeg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Nightwatch%20by%20Rembrandt%20-%20Rijksmuseum.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Sandro%20Botticelli%20-%20La%20nascita%20di%20Venere%20-%20Google%20Art%20Project%20-%20edited.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Gustav%20Klimt%20016.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Johannes%20Vermeer%20-%20Het%20melkmeisje%20-%20Google%20Art%20Project.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20the%20Elder%20-%20The%20Tower%20of%20Babel%20(Vienna)%20-%20Google%20Art%20Project%20-%20edited.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/El%20jard%C3%ADn%20de%20las%20Delicias%2C%20de%20El%20Bosco.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Monet%20-%20Impression%2C%20Sunrise.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/A%20Sunday%20on%20La%20Grande%20Jatte%2C%20Georges%20Seurat%2C%201884.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Vassily%20Kandinsky%2C%201913%20-%20Composition%207.jpg?width=1000", category: "abstract" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Piet%20Mondriaan%2C%201930%20-%20Mondrian%20Composition%20II%20in%20Red%2C%20Blue%2C%20and%20Yellow.jpg?width=1000", category: "abstract" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Whistlers%20Mother%20high%20res.jpg?width=1000", category: "portrait" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Van%20Eyck%20-%20Arnolfini%20Portrait.jpg?width=1000", category: "portrait" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Las%20Meninas%2C%20by%20Diego%20Vel%C3%A1zquez%2C%20from%20Prado%20in%20Google%20Earth.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Francisco%20de%20Goya%2C%20Saturno%20devorando%20a%20su%20hijo%20(1819-1823).jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/John%20Constable%20-%20The%20Hay%20Wain%20(1821).jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Fighting%20Temeraire%2C%20JMW%20Turner%2C%20National%20Gallery.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Red%20Fuji%20southern%20wind%20clear%20morning.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Pierre-Auguste%20Renoir%20-%20Luncheon%20of%20the%20Boating%20Party%20-%20Google%20Art%20Project.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Eug%C3%A8ne%20Delacroix%20-%20Le%2028%20Juillet.%20La%20Libert%C3%A9%20guidant%20le%20peuple.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Jean-Fran%C3%A7ois%20Millet%20(II)%20001.jpg?width=1000", category: "scene" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20Praying%20Hands%2C%201508%20-%20Google%20Art%20Project.jpg?width=1000", category: "stilllife" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Vincent%20van%20Gogh%20-%20Wheatfield%20with%20crows%20-%20Google%20Art%20Project.jpg?width=1000", category: "landscape" },
  { url: "https://commons.wikimedia.org/wiki/Special:FilePath/Vermeer-view-of-delft.jpg?width=1000", category: "landscape" },
];

export function pickRandomImage(): ImageEntry {
  return IMAGE_BANK[Math.floor(Math.random() * IMAGE_BANK.length)];
}
