export const VAGUE_WORDS: readonly string[] = [
  "significant",
  "significantly",
  "soon",
  "shortly",
  "major",
  "roughly",
  "approximately",
  "about",
  "probably",
  "likely",
  "unlikely",
  "better",
  "worse",
  "improving",
  "declining",
  "some",
  "several",
  "many",
  "few",
  "high",
  "low",
  "strong",
  "weak",
  "volatile",
  "considerably",
  "relatively",
  "quite",
  "pretty",
  "more or less",
  "as expected",
  "surprising",
  "sometime",
  "eventually",
  "big",
  "small",
  "moderate",
  "slight",
  "sharp",
  "plausible",
  "possible",
  "maybe",
  "might",
  "could",
];

const VAGUE_LOOKUP = new Set(VAGUE_WORDS);

const VAGUE_PHRASES = VAGUE_WORDS.filter((word) => word.includes(" ")).map(
  (phrase) => ({
    words: phrase.split(" "),
    label: phrase,
  }),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function findVagueWords(text: string): string[] {
  const tokens = tokenize(text);
  const found: string[] = [];

  for (let i = 0; i < tokens.length; ) {
    let matched = false;

    for (const phrase of VAGUE_PHRASES) {
      const slice = tokens.slice(i, i + phrase.words.length);
      if (slice.join(" ") === phrase.label) {
        found.push(phrase.label);
        i += phrase.words.length;
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    if (VAGUE_LOOKUP.has(tokens[i])) {
      found.push(tokens[i]);
    }
    i += 1;
  }

  return found;
}
