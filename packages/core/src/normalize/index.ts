// Deterministic normalizers (FR-13). Each returns `null` when it cannot parse
// with certainty — callers must then ask the user, never guess (PRD §10).

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

export function toAsciiDigits(input: string): string {
  return input.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
}

function clean(input: string): string {
  return toAsciiDigits(input.normalize('NFC')).trim().replace(/\s+/g, ' ');
}

const YES = ['yes', 'y', 'yeah', 'yep', 'haan', 'han', 'haa', 'ha', 'ji', 'ji haan', 'sahi', 'हाँ', 'हां', 'हा', 'जी', 'जी हाँ', 'जी हां', 'सही'];
const NO = ['no', 'n', 'nope', 'nahi', 'nahin', 'na', 'ji nahi', 'नहीं', 'नही', 'ना', 'जी नहीं'];

export function normalizeYesNo(input: string): 'Yes' | 'No' | null {
  const v = clean(input).toLowerCase().replace(/[.!?।]+$/u, '');
  if (YES.includes(v)) return 'Yes';
  if (NO.includes(v)) return 'No';
  return null;
}

export function normalizeNumber(input: string): string | null {
  const v = clean(input).replace(/,/g, '');
  return /^-?\d+(\.\d+)?$/.test(v) ? String(Number(v)) : null;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, जनवरी: 1,
  feb: 2, february: 2, फरवरी: 2, फ़रवरी: 2,
  mar: 3, march: 3, मार्च: 3,
  apr: 4, april: 4, अप्रैल: 4,
  may: 5, मई: 5,
  jun: 6, june: 6, जून: 6,
  jul: 7, july: 7, जुलाई: 7,
  aug: 8, august: 8, अगस्त: 8,
  sep: 9, sept: 9, september: 9, सितंबर: 9, सितम्बर: 9,
  oct: 10, october: 10, अक्टूबर: 10,
  nov: 11, november: 11, नवंबर: 11, नवम्बर: 11,
  dec: 12, december: 12, दिसंबर: 12, दिसम्बर: 12,
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

/** Case/space-insensitive match of a spoken answer to one of the options. */
export function matchOption(input: string, options: string[]): string | null {
  const key = (s: string) => clean(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '');
  const k = key(input);
  if (!k) return null;
  const exact = options.find((o) => key(o) === k);
  if (exact) return exact;
  // Accept a unique prefix match ("first" → "First year"), never an ambiguous one.
  const partial = options.filter((o) => key(o).startsWith(k));
  return partial.length === 1 ? partial[0]! : null;
}
