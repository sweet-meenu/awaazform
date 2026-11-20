// Deterministic normalizers (FR-13). Each returns `null` when it cannot parse
// with certainty — callers must then ask the user, never guess (PRD §10).

/** Code points of the digit zero in the scripts we support (each script's 0-9 are contiguous). */
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66];

/** Native digits (०१२, ০১২, ૧૨, ௧௨, ۱۲ …) to 0-9. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f]/g, (d) => {
    const cp = d.codePointAt(0)!;
    const zero = DIGIT_ZEROS.find((z) => cp >= z && cp <= z + 9)!;
    return String(cp - zero);
  });
}

function clean(input: string): string {
  return toAsciiDigits(input.normalize('NFC')).trim().replace(/\s+/g, ' ');
}

const YES = ['yes', 'y', 'yeah', 'yep', 'haan', 'han', 'haa', 'ha', 'ji', 'ji haan', 'sahi', 'हाँ', 'हां', 'हा', 'जी', 'जी हाँ', 'जी हां', 'सही',
  // Marathi / Nepali
  'ho', 'hoy', 'हो', 'होय', 'होय होय', 'हो हो', 'हजुर',
  // Bengali, Assamese, Gujarati, Punjabi, Urdu, Tamil, Telugu, Kannada, Malayalam
  'হ্যাঁ', 'হাঁ', 'হয়', 'হয়', 'હા', 'હાં', 'ਹਾਂ', 'ਹਾਂਜੀ', 'ਹਾਂ ਜੀ', 'ہاں', 'جی', 'جی ہاں', 'ஆம்', 'ஆமா', 'ஆமாம்',
  'అవును', 'ಹೌದು', 'അതെ', 'ഉവ്വ്', 'ആം'];
const NO = ['no', 'n', 'nope', 'nahi', 'nahin', 'na', 'ji nahi', 'नहीं', 'नही', 'ना', 'जी नहीं',
  // Marathi / Nepali
  'nahi', 'naahi', 'नाही', 'नको', 'होइन', 'छैन',
  // Bengali, Assamese, Gujarati, Punjabi, Urdu, Tamil, Telugu, Kannada, Malayalam
  'না', 'নহয়', 'নহয়', 'নাই', 'ના', 'ਨਹੀਂ', 'نہیں', 'نا', 'இல்லை', 'வேண்டாம்', 'కాదు', 'లేదు', 'ಇಲ್ಲ', 'ಬೇಡ', 'ഇല്ല', 'വേണ്ട'];

export function normalizeYesNo(input: string): 'Yes' | 'No' | null {
  const v = clean(input).toLowerCase().replace(/[.!?।]+$/u, '');
  if (YES.includes(v)) return 'Yes';
  if (NO.includes(v)) return 'No';
  return null;
}

/** Like normalizeYesNo, but also reads a leading yes/no in a sentence ("Yes, I do", "नहीं, मुझे नहीं चाहिए"). */
export function leadingYesNo(input: string): 'Yes' | 'No' | null {
  const toks = clean(input).toLowerCase().split(/[\s,.!?।]+/u).filter(Boolean);
  return normalizeYesNo(toks.join(' ')) ?? normalizeYesNo(toks.slice(0, 2).join(' ')) ?? normalizeYesNo(toks[0] ?? '');
}

export function normalizeNumber(input: string): string | null {
  const v = clean(input).replace(/,/g, '');
  return /^-?\d+(\.\d+)?$/.test(v) ? String(Number(v)) : null;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, जनवरी: 1, जानेवारी: 1,
  feb: 2, february: 2, फरवरी: 2, फ़रवरी: 2, फेब्रुवारी: 2,
  mar: 3, march: 3, मार्च: 3,
  apr: 4, april: 4, अप्रैल: 4, एप्रिल: 4,
  may: 5, मई: 5, मे: 5,
  jun: 6, june: 6, जून: 6,
  jul: 7, july: 7, जुलाई: 7, जुलै: 7,
  aug: 8, august: 8, अगस्त: 8, ऑगस्ट: 8,
  sep: 9, sept: 9, september: 9, सितंबर: 9, सितम्बर: 9, सप्टेंबर: 9,
  oct: 10, october: 10, अक्टूबर: 10, ऑक्टोबर: 10,
  nov: 11, november: 11, नवंबर: 11, नवम्बर: 11, नोव्हेंबर: 11,
  dec: 12, december: 12, दिसंबर: 12, दिसम्बर: 12, डिसेंबर: 12,
};

function isoDate(y: number, m: number, d: number): string | null {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Returns ISO `YYYY-MM-DD`. Numeric dates are read day-first (Indian convention). */
export function normalizeDate(input: string): string | null {
  const v = clean(input).toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return isoDate(+m[1]!, +m[2]!, +m[3]!);

  m = v.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/);
  if (m) return isoDate(+m[3]!, +m[2]!, +m[1]!);

  // "12 March 2001", "12 मार्च 2001", "March 12 2001"
  // \p{M} is needed: Devanagari vowel signs are combining marks, not letters.
  m = v.match(/^(\d{1,2}) ([\p{L}\p{M}]+) (\d{4})$/u);
  if (m && MONTHS[m[2]!]) return isoDate(+m[3]!, MONTHS[m[2]!]!, +m[1]!);
  m = v.match(/^([\p{L}\p{M}]+) (\d{1,2}) (\d{4})$/u);
  if (m && MONTHS[m[1]!]) return isoDate(+m[3]!, MONTHS[m[1]!]!, +m[2]!);

  return null;
}

/** Formats an ISO date for display/fill, e.g. `DD/MM/YYYY`. */
export function formatDate(iso: string, format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'): string {
  const [y, m, d] = iso.split('-');
  if (format === 'YYYY-MM-DD') return iso;
  return format === 'DD/MM/YYYY' ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}

/** Returns 24h `HH:MM`. */
export function normalizeTime(input: string): string | null {
  const v = clean(input).toLowerCase().replace(/\./g, ':');
  const m = v.match(/^(\d{1,2})(?::(\d{2}))? ?(am|pm|बजे)?$/);
  if (!m) return null;
  let h = +m[1]!;
  const min = m[2] ? +m[2] : 0;
  if (m[3] === 'pm' && h < 12) h += 12;
  if (m[3] === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  // A bare "5" without am/pm is ambiguous — don't guess.
  if (!m[2] && (!m[3] || m[3] === 'बजे')) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Strips separators; keeps a leading `+`. Indian 10-digit numbers get no prefix added. */
export function normalizePhone(input: string): string | null {
  const v = clean(input).replace(/[\s\-().]/g, '');
  if (/^\+\d{8,15}$/.test(v)) return v;
  if (/^0?\d{10}$/.test(v)) return v.replace(/^0/, '');
  return null;
}

export function normalizeEmail(input: string): string {
  // Spoken forms: "ayush at the rate gmail dot com". Only whole words are replaced.
  return ` ${clean(input).toLowerCase()} `
    .replace(/ (at the rate|at) /g, '@')
    .replace(/ dot /g, '.')
    .replace(/\s/g, '');
}

// ---- Choosing an option by voice -------------------------------------------------------------
// People rarely read an option back word for word. They say "the second one", "दूसरा", "option B",
// "I'm a student", or a Hindi/Marathi word for an English option. Each step below only accepts a
// single, unambiguous option; anything else returns null so the user is asked again (PRD §10).

const optionKey = (s: string) => clean(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '');
const words = (s: string) => clean(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  // Hindi (and romanised)
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9, दस: 10,
  पहला: 1, पहली: 1, पहले: 1, दूसरा: 2, दूसरी: 2, दूसरे: 2, तीसरा: 3, तीसरी: 3, चौथा: 4, चौथी: 4, पांचवां: 5, पाँचवाँ: 5, पांचवीं: 5,
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, pehla: 1, pahla: 1, pehli: 1, doosra: 2, dusra: 2, dusri: 2, teesra: 3, tisra: 3, chautha: 4,
  // Marathi
  दोन: 2, पाच: 5, सहा: 6, नऊ: 9, पहिला: 1, पहिली: 1, दुसरा: 2, दुसरी: 2, तिसरा: 3, तिसरी: 3, पाचवा: 5, पाचवी: 5,
  pahila: 1, dusara: 2, tisara: 3, don: 2,
  last: -1, आखिरी: -1, अंतिम: -1, शेवटचा: -1, शेवटची: -1,
};

/** Common options said in Hindi or Marathi for an English form (the model translates the rest). */
const SYNONYMS: Record<string, string[]> = {
  male: ['पुरुष', 'मर्द', 'आदमी', 'लड़का', 'purush', 'पुरूष', 'मुलगा'],
  female: ['महिला', 'स्त्री', 'औरत', 'लड़की', 'mahila', 'stree', 'मुलगी', 'बाई'],
  other: ['अन्य', 'दूसरा कोई', 'इतर', 'anya', 'itar'],
  yes: ['हाँ', 'हां', 'हो', 'होय', 'haan', 'ho', 'hoy'],
  no: ['नहीं', 'नाही', 'nahi', 'nahin'],
  married: ['शादीशुदा', 'विवाहित', 'shadishuda', 'vivahit'],
  unmarried: ['अविवाहित', 'कुंवारा', 'avivahit'],
  single: ['अविवाहित', 'सिंगल'],
  student: ['छात्र', 'छात्रा', 'विद्यार्थी', 'chhatra', 'vidyarthi'],
  teacher: ['शिक्षक', 'अध्यापक', 'shikshak'],
  'self employed': ['स्वरोजगार', 'खुद का काम', 'स्वयंरोजगार'],
  employed: ['नौकरी', 'नोकरी', 'naukri', 'nokri'],
  unemployed: ['बेरोजगार', 'berozgar'],
  morning: ['सुबह', 'सकाळ', 'subah'],
  evening: ['शाम', 'संध्याकाळ', 'shaam'],
  afternoon: ['दोपहर', 'दुपार', 'dopahar'],
  english: ['अंग्रेज़ी', 'अंग्रेजी', 'इंग्रजी', 'angrezi'],
  hindi: ['हिंदी', 'हिन्दी'],
  marathi: ['मराठी'],
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

const only = <T>(xs: T[]): T | null => (xs.length === 1 ? xs[0]! : null);
const NEGATION = /\b(not|no|don'?t|never|nahi|nahin|naahi)\b|नहीं|नाही|मत\b/u;

/** "option 2", "the second one", "दूसरा वाला", "B" → a 0-based index, or null. */
function spokenIndex(input: string, count: number): number | null {
  const w = words(input)
    .replace(/\b(the|option|number|no|choice|one|wala|wali|vala|vali|walā)\b/g, (m) => (m === 'one' ? 'one' : ' '))
    .replace(/(वाला|वाली|वाले|नंबर|विकल्प|ऑप्शन|पर्याय|क्रमांक|नंबरचा|वाला ऑप्शन)/gu, ' ')
    .replace(/\s+/g, ' ').trim();
  const tokens = w.split(' ').filter(Boolean);
  // "second one" → drop the trailing "one" when another number word is present.
  const t = tokens.length > 1 && tokens.at(-1) === 'one' ? tokens.slice(0, -1) : tokens;
  if (t.length !== 1) return null;
  const tok = t[0]!.replace(/^(\d+)(st|nd|rd|th)$/, '$1');
  let n: number | null = null;
  if (/^\d{1,2}$/.test(tok)) n = Number(tok);
  else if (tok in NUMBER_WORDS) n = NUMBER_WORDS[tok]!;
  else if (/^[a-j]$/.test(tok) && count > 1) n = tok.charCodeAt(0) - 96;
  if (n === -1) return count - 1;
  return n !== null && n >= 1 && n <= count ? n - 1 : null;
}

/**
 * Matches a spoken or typed answer to one option. Tries, in order: exact text, a spoken number word
 * for numeric options (scales), the option's position ("second", "दूसरा", "B"), a unique prefix,
 * a known Hindi/Marathi synonym, the option named inside a sentence, and a close spelling.
 */
export function matchOption(input: string, options: string[]): string | null {
  const k = optionKey(input);
  if (!k || options.length === 0) return null;
  const keys = options.map(optionKey);

  const exact = options.find((_, i) => keys[i] === k);
  if (exact) return exact;

  // Scales: "three" / "तीन" → "3" when the options are numbers.
  const asNumber = NUMBER_WORDS[words(input)];
  if (asNumber && asNumber > 0) {
    const hit = options.find((o) => optionKey(o) === String(asNumber));
    if (hit) return hit;
  }

  const idx = spokenIndex(input, options.length);
  if (idx !== null && !keys.some((key) => /^\d+$/.test(key))) return options[idx]!;
  if (idx !== null && /\b(option|number|choice)\b|नंबर|विकल्प|पर्याय/u.test(input.toLowerCase())) return options[idx]!;

  const prefix = only(options.filter((_, i) => keys[i]!.startsWith(k)));
  if (prefix && k.length >= 2) return prefix;

  const syn = only(options.filter((o) => {
    const list = SYNONYMS[words(o)];
    return !!list?.some((s) => optionKey(s) === k);
  }));
  if (syn) return syn;

  const w = ` ${words(input)} `;
  if (!NEGATION.test(w)) {
    // "I am a student" → "Student". Prefer the longest option named, if it contains the shorter ones.
    const named = options.filter((o) => { const ow = words(o); return ow.length >= 2 && w.includes(` ${ow} `); });
    const longest = named.sort((a, b) => b.length - a.length)[0];
    if (longest && named.every((o) => words(longest).includes(words(o)))) return longest;
    const viaSyn = only(options.filter((o) => SYNONYMS[words(o)]?.some((s) => w.includes(` ${words(s)} `))));
    if (viaSyn) return viaSyn;
    // "blood pressure" → "Blood pressure, sugar" (the answer is part of exactly one option).
    if (k.length >= 4) {
      const within = only(options.filter((_, i) => keys[i]!.includes(k)));
      if (within) return within;
    }
  }

  // Close spelling, for transcription slips ("Bangalore" → "Bengaluru" won't match; "Saterday" will).
  if (k.length >= 4) {
    const scored = options.map((o, i) => ({ o, d: levenshtein(k, keys[i]!) / Math.max(k.length, keys[i]!.length) })).sort((a, b) => a.d - b.d);
    if (scored[0] && scored[0].d <= 0.25 && (!scored[1] || scored[1].d - scored[0].d >= 0.15)) return scored[0].o;
  }
  return null;
}

const ALL = /^(all|all of them|all of these|everything|both|sab|sabhi|sab kuch|dono|सब|सभी|सब कुछ|दोनों|सगळे|सगळं|सर्व|दोन्ही)$/u;

/**
 * Matches a multi-select answer ("eye check-up and dental", "पहला और तीसरा", "all of them").
 * Returns the options in form order, or null if any part is unclear.
 */
export function matchOptions(input: string, options: string[]): string[] | null {
  const v = clean(input).toLowerCase().replace(/[.!?।]+$/u, '').trim();
  if (!v) return null;
  if (ALL.test(v)) return [...options];
  // Whole-answer match first, so options that contain commas ("Blood pressure, sugar") survive.
  const whole = matchOption(v, options);
  if (whole && optionKey(whole) === optionKey(v)) return [whole];
  const parts = v.split(/\s*(?:,|;|&|\band\b|\bor\b|\bplus\b|और|तथा|आणि|व\b)\s*/u).map((p) => p.trim()).filter(Boolean);
  const picked = new Set<string>();
  for (let i = 0; i < parts.length; i++) {
    // Re-join neighbours when an option itself contains a separator ("Blood pressure, sugar").
    let hit: string | null = null;
    for (let j = parts.length; j > i && !hit; j--) {
      const joined = parts.slice(i, j).join(', ');
      const m = matchOption(joined, options);
      if (m && (j === i + 1 || optionKey(m) === optionKey(joined))) { hit = m; i = j - 1; }
    }
    if (!hit) return null;
    picked.add(hit);
  }
  return options.filter((o) => picked.has(o));
}

// ---- Pulling the value out of a spoken sentence ----------------------------------------------
// People answer in sentences: "My name is Ayush Shukla", "I use ayush at gmail dot com",
// "मेरा नाम आयुष है". The AI normally extracts the value; this is the deterministic fallback, and it
// also repairs how speech-to-text writes emails. It only removes words around the answer; it never
// invents or reorders anything.

const LEAD_INS = [
  /^(?:well|so|okay|ok|umm?|uh|hmm)[,\s]+/i,
  /^(?:my|the)\s+(?:full\s+)?(?:name|email(?:\s+address|\s+id)?|e-mail|mail(?:\s+id)?|phone(?:\s+number)?|mobile(?:\s+number)?|number|answer|age|city|address|course|department|campus)\s+(?:is|would be|will be|'s)\s+/i,
  /^(?:it\s+is|it's|its|this\s+is|that\s+is|that's|i\s+am|i'm|i\s+use|i\s+live\s+in|i\s+study|call\s+me|you\s+can\s+write|please\s+write|write|put)\s+/i,
  /^(?:मेरा|मेरी|हमारा)\s+(?:पूरा\s+)?(?:नाम|ईमेल|ई-मेल|मेल|फ़ोन|फोन|मोबाइल|नंबर|उम्र|शहर|पता)(?:\s+(?:नंबर|आईडी))?\s+/u,
  /^(?:माझं|माझे|माझा|माझी)\s+(?:पूर्ण\s+)?(?:नाव|ईमेल|फोन|मोबाईल|नंबर|वय|शहर|पत्ता)\s+/u,
  /^(?:mera|meri)\s+(?:poora\s+)?(?:naam|email|phone|mobile|number)\s+/i,
  // Marathi as English letters (browser recognition hears names as Indian English): "majhe naav Ayush aahe".
  /^(?:majh[aei]|maajh[aei]|maz[aeh]|mazh[ae]|majha|maza)\s+(?:poorn[ae]?\s+|purn[ae]?\s+)?(?:naav|nav|naw|naam|email|e-mail|phone|mobile|number|patta|pata)\s+/i,
];
const TAILS = [/\s+(?:है|हैं|हे|आहे|hai|aahe|ahe)$/u, /\s+(?:please|thank you|thanks)$/i];

/** Joins spelled-out letters ("a y u s h" → "ayush"). */
function joinSpelled(s: string): string {
  return s.replace(/\b(?:[a-z0-9]\s+){2,}[a-z0-9]\b/gi, (m) => m.replace(/\s+/g, ''));
}

/** Email providers people name out loud, and how speech-to-text writes them. */
const PROVIDERS: [RegExp, string][] = [
  [/\b(?:g\s*-?\s*mail|gee\s*mail|jimail|gmial|gmai|gamil|gmal|gmil|gnail|gmaill)\b|जीमेल|जी मेल/giu, 'gmail'],
  [/\b(?:yahoo+|yaho|yahu)\b|याहू/giu, 'yahoo'],
  [/\b(?:hot\s*mail|hotmial|hotmal)\b|हॉटमेल/giu, 'hotmail'],
  [/\b(?:out\s*look|outlok)\b|आउटलुक/giu, 'outlook'],
  [/\b(?:rediff\s*mail|redif+\s*mail)\b|रेडिफ\s*मेल/giu, 'rediffmail'],
  [/\b(?:i\s*cloud)\b/giu, 'icloud'],
];
export const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com', 'icloud.com'];

/**
 * Fixes common slips in an email's domain, the way sign-up forms suggest: gmial.com → gmail.com,
 * gmail.co / gmail.con → gmail.com. Only well-known providers are touched; anything else is left alone.
 */
export function fixEmailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 0) return email;
  let domain = email.slice(at + 1).toLowerCase();
  for (const [re, name] of PROVIDERS) domain = domain.replace(new RegExp(re.source, re.flags), name);
  const m = domain.match(/^(gmail|yahoo|hotmail|outlook|rediffmail|icloud)\.?(c|co|cm|om|con|comm|cmo|ocm)?$/);
  if (m) domain = `${m[1]}.com`;
  return `${email.slice(0, at)}@${domain}`;
}

/** Finds an email in speech-to-text output, reading spoken symbols in English, Hindi and Marathi. */
export function extractEmail(input: string): string | null {
  let v = ` ${toAsciiDigits(input.normalize('NFC')).toLowerCase()} `.replace(/[“”"']/g, ' ');
  for (const [re, name] of PROVIDERS) v = v.replace(new RegExp(re.source, re.flags), ` ${name} `);
  v = v
    // "a for apple", "b as in bombay" → the letter
    .replace(/\s([a-z])\s+(?:for|as\s+in|फॉर)\s+[\p{L}]+/giu, ' $1')
    // "double a", "triple 7"
    .replace(/\s(?:double|डबल)\s+([a-z0-9])\b/giu, ' $1$1').replace(/\s(?:triple|ट्रिपल)\s+([a-z0-9])\b/giu, ' $1$1$1')
    .replace(/\s+(?:at\s+(?:the|d|da)\s+rate(?:\s+of)?|at\s+rate|at\s+sign|at|एट\s+द\s+रेट|ऐट\s+द\s+रेट|एट|ऍट|ॲट)\s+/gu, ' @ ')
    .replace(/\s*(?:dot\s*com|डॉट\s*कॉम)\b/gu, ' .com ')
    .replace(/\s+(?:dot|period|point|डॉट|डोट)\s+/gu, ' . ')
    .replace(/\s+(?:underscore|अंडरस्कोर)\s+/gu, ' _ ')
    .replace(/\s+(?:dash|hyphen|minus|डैश)\s+/gu, ' - ')
    .replace(/\s+(?:कॉम)\b/gu, ' com');
  // No "at" heard, but a provider was: "ayush shukla gmail dot com" → put the @ before it.
  if (!v.includes('@')) v = v.replace(/\s(gmail|yahoo|hotmail|outlook|rediffmail|icloud)\b/, ' @ $1');
  v = joinSpelled(v).replace(/\s*([._-])\s*/g, '$1');
  const at = v.indexOf('@');
  if (at < 0) return null;
  // Everything said before @ (after "my email is" and the like) is the username, spaces removed:
  // "ayush shukla @ gmail" → "ayushshukla".
  let left = v.slice(0, at).trim();
  for (let pass = 0; pass < 2; pass++) for (const re of LEAD_INS) left = left.replace(re, '');
  const local = left.replace(/\s+/g, '').replace(/[^\w.+-]/g, '').replace(/^[._-]+/, '');
  let right = v.slice(at + 1).trim().split(/\s+/)[0]!.replace(/[^\w.-]/g, '').replace(/\.+$/, '');
  if (/^(gmail|yahoo|hotmail|outlook|rediffmail|icloud)$/.test(right)) right += '.com'; // "at gmail"
  const email = fixEmailDomain(`${local}@${right}`);
  return /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(email) ? email : null;
}

/**
 * Just the part before @, when that's all someone said ("ayush shukla", "a y u s h 9 8"): AwaazForm then
 * asks which provider, instead of guessing. Null if it doesn't look like a username.
 */
export function emailUsername(input: string): string | null {
  let v = ` ${toAsciiDigits(input.normalize('NFC')).toLowerCase()} `.replace(/[“”"'.!?।]/g, ' ');
  if (v.includes('@') || /\b(?:at|dot)\b/.test(v)) return null;
  v = v.replace(/\s([a-z])\s+(?:for|as\s+in)\s+[a-z]+/g, ' $1')
    .replace(/\s+(?:underscore|अंडरस्कोर)\s+/gu, ' _ ').replace(/\s+(?:dash|hyphen)\s+/g, ' - ');
  v = joinSpelled(v).trim();
  for (let pass = 0; pass < 2; pass++) for (const re of LEAD_INS) v = v.replace(re, '');
  const user = v.replace(/\s*([._-])\s*/g, '$1').replace(/\s+/g, '');
  return /^[a-z0-9][a-z0-9._+-]{1,40}$/.test(user) ? user : null;
}

/** The provider someone named on its own ("Gmail", "जीमेल", "yahoo dot com"), as a domain. */
export function emailProvider(input: string): string | null {
  let v = ` ${input.normalize('NFC').toLowerCase()} `;
  for (const [re, name] of PROVIDERS) v = v.replace(new RegExp(re.source, re.flags), ` ${name} `);
  const m = v.match(/\b(gmail|yahoo|hotmail|outlook|rediffmail|icloud)\b/);
  return m && v.trim().split(/\s+/).length <= 4 ? `${m[1]}.com` : null;
}

/** How to read an email back so each letter is clear: “a y u s h, at gmail dot com”. */
export function spokenEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  const say: Record<string, string> = { '.': 'dot', _: 'underscore', '-': 'dash', '+': 'plus' };
  const letters = [...local].map((c) => say[c] ?? c).join(' ');
  const known = EMAIL_DOMAINS.includes(domain);
  return `${letters}, at ${known ? domain.replace('.', ' dot ') : domain.replace(/\./g, ' dot ')}`;
}

/**
 * The answer inside a spoken sentence, for short fields (text, email, phone, number, date, time).
 * Long answers (paragraphs) and option questions are left to their own handling.
 */
export function cleanSpokenAnswer(type: string, raw: string): string {
  let v = raw.normalize('NFC').trim().replace(/[.!?।]+$/u, '').trim();
  if (type === 'paragraph' || !v) return v;
  if (type === 'email') {
    const direct = v.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
    return direct ? direct[0] : extractEmail(v) ?? v;
  }
  if (type === 'phone') {
    const digits = joinSpelled(toAsciiDigits(v)).match(/\+?\d[\d\s-]{8,}\d/);
    return digits ? digits[0] : v;
  }
  if (type === 'number') {
    const n = toAsciiDigits(v).match(/-?\d+(?:[.,]\d+)?/);
    return n ? n[0] : v;
  }
  for (let pass = 0; pass < 2; pass++) for (const re of LEAD_INS) v = v.replace(re, '');
  for (const re of TAILS) v = v.replace(re, '');
  return v.trim().replace(/^[,:-]\s*/, '') || raw.trim();
}

// ---- Turn-taking helpers for Live Mode -------------------------------------------------------

/**
 * Whether someone stopped mid-sentence ("my email is…", "and…", "मेरा नाम…"). Live Mode then waits a
 * moment for the rest instead of answering half a thought.
 */
export function looksUnfinished(text: string): boolean {
  const v = text.normalize('NFC').trim().toLowerCase();
  if (!v) return false;
  if (/[,;:–-]$/.test(v)) return true;
  // "my name", "मेरा नाम", "माझं नाव": said what, but not yet the answer.
  if (/(?:^|\s)(my|your|मेरा|मेरी|मेरे|माझं|माझे|माझा|माझी|mera|meri)\s+[\p{L}\p{M}]+$/u.test(v)) return true;
  return /(?:^|\s)(and|or|but|so|because|my|is|are|the|a|an|to|of|at|in|with|dot|underscore|hyphen|um+|uh+|like|और|या|लेकिन|मेरा|मेरी|मेरे|का|की|के|को|से|में|एट|डॉट|आणि|किंवा|माझं|माझे|माझा|माझी|चा|ची|चे)$/u.test(v);
}

/**
 * A clear, short answer that needs no AI round trip: an email, phone, number, date or time that
 * validates once taken out of the sentence, or a short name/word in Latin letters. Returns the value to
 * propose, or null to let the AI interpret it (several answers at once, other scripts, anything unclear).
 */
export function quickValue(type: string, raw: string, language = 'en', label = ''): string | null {
  const v = raw.trim();
  if (!v || v.split(/\s+/).length > 12) return null;
  if (/\s(and|aur|और|आणि)\s|,/.test(v) && type !== 'email') return null; // possibly several answers
  const clean = cleanSpokenAnswer(type, v);
  switch (type) {
    case 'email': return /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(clean) ? clean : null;
    case 'phone': return normalizePhone(clean) ? clean : null;
    case 'number': return normalizeNumber(clean) ? clean : null;
    case 'date': return normalizeDate(clean) ? clean : null;
    case 'time': return normalizeTime(clean) ? clean : null;
    // Only for English: in other languages a short Latin-letter transcript is often a romanised sentence
    // (“majhe naav Ayush aahe”) or a misheard one, and needs the AI to pick out the name.
    case 'text': {
      if (!/^[A-Za-z][A-Za-z .'-]{0,60}$/.test(clean) || clean.split(/\s+/).length > 4) return null;
      if (language === 'en') return clean;
      // Names in Hindi or Marathi sessions: rules first when the sentence is clear ("majhe naav Ayush
      // aahe" → "Ayush"); a longer Latin transcript may be a misheard sentence, so the AI looks at it.
      const name = /\bname\b|नाम|नाव/i.test(label);
      return name && (clean !== v.replace(/[.!?।]+$/u, '').trim() || clean.split(/\s+/).length <= 3) ? clean : null;
    }
    default: return null;
  }
}
