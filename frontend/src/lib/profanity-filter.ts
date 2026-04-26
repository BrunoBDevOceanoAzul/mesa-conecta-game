/**
 * Profanity filter for Portuguese (BR) based on kyriosdata/palavrao.
 * Normalises input (lowercase, removes accents) and checks against a Set for O(1) lookups.
 */

const WORD_LIST = [
  "arrombada","arrombadas","arrombado","babaca","bacurinha","baitola","bichona",
  "bixa","boceta","boiola","bolcinha","bolsinha","boquete","boqueteira",
  "boqueteiro","boquetera","boquetero","boquetes","bosta","brecheca","bucefula",
  "buceta","bucetao","bucetas","bucetasso","bucetinha","bucetinhas","bucetonas",
  "cacete","cachorra","cachuleta","cagalhao","caralha","caralho","caralhudo",
  "cassete","cequelada","cequelado","chalerinha","chatico","chavasca","checheca",
  "chereca","chibio","chimbica","chupada","chupador","chupadora","chupando",
  "chupeta","chupetinha","chupou","crista de galo","crossdresser","cu","cuecao",
  "custozinha","cuzao","cuzinho","cuzinhos","dadeira","encoxada","engole-espada",
  "enrabadas","filha da puta","filho da puta","fornicada","fudendo","fudido",
  "furustreca","gostozudas","gozada","gozadas","greludas","gulosinha","katchanga",
  "lesbofetiche","lixa-pica","mede-rola","megasex","mela-pentelho","meleca",
  "melequinha","menage","menages","merda","merdao","meretriz","metendo","mijada",
  "ninho de rola","otario","papa-duro","pausudas","pechereca","peidao","peido",
  "peidorreiro","peituda","peitudas","periquita","pica","piranhuda","piriguetes",
  "piroca","pirocao","pirocas","pirocudo","pitbitoca","pitchbicha","pitchbitoca",
  "pithbicha","pithbitoca","pitibicha","pitrica","pixota","porra",
  "porteira do caralho","prencheca","prexeca","priquita","priquito","punheta",
  "punheteiro","pussy","puta","putaria","putas","putinha","quebra-pinto","quenga",
  "rabuda","rabudas","rameira","rapariga","retardado","saca-rola","safada",
  "safadas","safado","safados","sequelada","sexboys","sexgatas","sirica",
  "siririca","sotravesti","suga pinto","suruba","surubas","taioba","tarada",
  "tchaca","tcheca","tchonga","tchuchuca","tchutchuca","tesuda","tesudas",
  "tesudo","tetinha","tezao","tezuda","tezudo","tgatas","t-girls","tobinha",
  "tomba-macho","topsexy","transa","transando","travecas","traveco","travecos",
  "trepada","trepadas","vacilao","vadjaina","vagabunda","vagabundo","vaginismo",
  "vajoca","veiaca","veiaco","viadinho","viado","xabasca","xana","xaninha",
  "xatico","xavasca","xebreca","xereca","xexeca","xibio","xoroca","xota",
  "xotinha","xoxota","xoxotas","xoxotinha","xulipa","xumbrega","xupaxota",
  "xupeta","xupetinha",
  // Extras common in online RPG/gaming communities
  "fdp","pqp","vsf","tnc","krl","caralh","foda","foder","fodase","foda-se",
  "crl","puto","putos","desgraca","desgraça","arrombado","corno","cornudo",
];

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim();
}

// Single words set for fast lookup
const singleWords = new Set<string>();
// Multi-word phrases for phrase matching
const multiWordPhrases: string[] = [];

for (const w of WORD_LIST) {
  const n = normalise(w);
  if (n.includes(" ") || n.includes("-")) {
    multiWordPhrases.push(n);
  } else {
    singleWords.add(n);
  }
}

/**
 * Check if text contains any profanity. Returns true if profanity is found.
 */
export function containsProfanity(text: string): boolean {
  const norm = normalise(text);

  // Check multi-word phrases
  for (const phrase of multiWordPhrases) {
    if (norm.includes(phrase)) return true;
  }

  // Check individual words
  const words = norm.split(/[\s\-]+/);
  for (const word of words) {
    if (word.length < 2) continue;
    if (singleWords.has(word)) return true;
  }

  return false;
}

/**
 * Censor profanity by replacing matched words with asterisks.
 */
export function censorText(text: string): string {
  let result = text;

  // Censor multi-word phrases first
  for (const phrase of multiWordPhrases) {
    const regex = new RegExp(phrase.replace(/[-]/g, "[-\\s]?"), "gi");
    result = result.replace(regex, (match) => match[0] + "*".repeat(match.length - 1));
  }

  // Censor individual words
  const parts = result.split(/(\s+)/);
  return parts
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const norm = normalise(part);
      if (singleWords.has(norm)) {
        return part[0] + "*".repeat(part.length - 1);
      }
      return part;
    })
    .join("");
}

/** Validation message for the user */
export const PROFANITY_WARNING = "Seu texto contém termos inadequados. Por favor, revise antes de enviar.";
