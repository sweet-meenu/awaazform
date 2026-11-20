// Form definitions, parsing, validation and formatting. Pure logic, no DOM.

export const STORAGE_KEY = 'awaazform-saved';
export const PREFS_KEY = 'awaazform-prefs';
export const EXPIRY_MS = 24 * 60 * 60 * 1000;

const opt = (v, en, hi = en) => ({ v, en, hi });
const f = (id, type, required, en, hi, extra = {}) => ({ id, type, required, label: { en, hi }, ...extra });

export const SAMPLE_FORMS = {
  scholar: {
    id: 'scholar',
    title: { en: 'Scholarship form', hi: 'छात्रवृत्ति फॉर्म' },
    fields: [
      f('name', 'text', true, 'What is your full name?', 'आपका पूरा नाम क्या है?',
        { hint: { en: 'Write it the same way as on your school certificate.', hi: 'वैसे ही बताइए जैसा स्कूल प्रमाणपत्र में लिखा है।' } }),
      f('dob', 'date', true, 'What is your date of birth?', 'आपकी जन्मतिथि क्या है?',
        { hint: { en: 'Say it like 15 August 2008, or type 15/08/2008.', hi: 'जैसे 15 अगस्त 2008 या 15/08/2008।' } }),
      f('father', 'text', true, "What is your father's name?", 'आपके पिता का नाम क्या है?'),
      f('income', 'select', true, "What is your family's yearly income?", 'परिवार की सालाना आय कितनी है?',
        { options: [
          opt('below_1l', 'Below ₹1 lakh', '₹1 लाख से कम'),
          opt('1_to_2_5l', '₹1 to ₹2.5 lakh', '₹1 से ₹2.5 लाख'),
          opt('2_5_to_5l', '₹2.5 to ₹5 lakh', '₹2.5 से ₹5 लाख'),
          opt('above_5l', 'Above ₹5 lakh', '₹5 लाख से ज़्यादा'),
        ] }),
      f('category', 'select', true, 'Which category are you in?', 'आप किस वर्ग से हैं?',
        { options: [opt('General', 'General', 'सामान्य'), opt('OBC', 'OBC'), opt('SC', 'SC'), opt('ST', 'ST')] }),
      f('phone', 'phone', true, 'What is your mobile number?', 'आपका मोबाइल नंबर क्या है?',
        { hint: { en: '10 digits. Example: 98765 43210', hi: '10 अंक। जैसे 98765 43210' } }),
      f('email', 'email', false, 'What is your email address?', 'आपका ईमेल पता क्या है?'),
      f('pin', 'pin', true, 'What is your PIN code?', 'आपका पिन कोड क्या है?',
        { hint: { en: '6 digits', hi: '6 अंक' } }),
      f('aadhaar', 'sensitive', false, 'What is your Aadhaar number?', 'आपका आधार नंबर क्या है?',
        { hint: { en: 'This is private. It stays hidden on screen.', hi: 'यह निजी है। स्क्रीन पर छिपा रहेगा।' } }),
    ],
  },

  camp: {
    id: 'camp',
    title: { en: 'Health camp form', hi: 'स्वास्थ्य शिविर फॉर्म' },
    fields: [
      f('name', 'text', true, 'What is your name?', 'आपका नाम क्या है?'),
      f('age', 'number', true, 'How old are you?', 'आपकी उम्र कितनी है?',
        { hint: { en: 'Say or type your age in years.', hi: 'अपनी उम्र साल में बताएँ।' } }),
      f('blood', 'select', false, 'What is your blood group?', 'आपका ब्लड ग्रुप क्या है?',
        { options: [
          opt('A+', 'A+'), opt('A-', 'A-'), opt('B+', 'B+'), opt('B-', 'B-'),
          opt('AB+', 'AB+'), opt('AB-', 'AB-'), opt('O+', 'O+'), opt('O-', 'O-'),
          opt('unknown', "Don't know", 'मालूम नहीं'),
        ] }),
      f('village', 'text', true, 'Which village do you live in?', 'आप किस गाँव में रहते हैं?'),
      f('pin', 'pin', true, 'What is your PIN code?', 'आपका पिन कोड क्या है?'),
      f('phone', 'phone', true, 'What is your mobile number?', 'आपका मोबाइल नंबर क्या है?'),
      f('date', 'date', true, 'Which date would you like to come to the camp?', 'शिविर में आने की कौन सी तारीख चुनेंगे?',
        { hint: { en: 'Example: 12/12/2026', hi: 'जैसे 12/12/2026' } }),
    ],
  },
};

// ---------- Digits ----------
const DEV_DIGITS = '०१२३४५६७८९';
export const toAscii = (s) => String(s).replace(/[०-९]/g, (d) => DEV_DIGITS.indexOf(d));
export const toDev = (s) => String(s).replace(/[0-9]/g, (d) => DEV_DIGITS[d]);

// ---------- Labels & display ----------
export function labelFor(field, lang) {
  return field.label[lang] || field.label.en || field.label.hi || Object.values(field.label)[0];
}

export function fieldPrefill(field, stored) {
  if (stored === undefined || stored === null) return '';
  if (field.type === 'date') return displayValue(field, stored, 'en');
  return String(stored);
}

const mask = (v) => {
  const s = String(v).replace(/\s/g, '');
  return 'X'.repeat(Math.max(0, s.length - 4)) + s.slice(-4);
};

export function displayValue(field, v, lang) {
  if (v === undefined || v === null || v === '') return '';
  const fmt = (s) => (lang === 'hi' ? toDev(s) : s);
  if (field.type === 'select') {
    const o = (field.options || []).find((x) => x.v === v);
    return o ? (o[lang] || o.en) : String(v);
  }
  if (field.type === 'date') {
    const [y, m, d] = String(v).split('-');
    return fmt(`${d}/${m}/${y}`);
  }
  if (field.type === 'sensitive') return mask(v);
  return fmt(v);
}

// ---------- Validation & normalising ----------
const ok = (value) => ({ valid: true, value });
const bad = (err) => ({ valid: false, err });

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

function parseDate(s) {
  let y; let m; let d; let x;
  if ((x = s.match(/^(\d{1,2})[/\-.\s](\d{1,2})[/\-.\s](\d{4}|\d{2})$/))) {
    d = +x[1]; m = +x[2]; y = +x[3];
    if (x[3].length === 2) y += y < 30 ? 2000 : 1900;
  } else if ((x = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    y = +x[1]; m = +x[2]; d = +x[3];
  } else if ((x = s.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/))) {
    d = +x[1]; m = MONTHS.indexOf(x[2]) + 1; y = +x[3];
    if (!m) return null;
  } else {
    return null;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function matchOption(field, raw) {
  const s = toAscii(raw).trim().toLowerCase();
  const digits = s.match(/\d+/);
  if (digits && s.length <= 12) {
    const byNumber = field.options[Number(digits[0]) - 1];
    if (byNumber) return byNumber;
  }
  return field.options.find((o) => [o.v, o.en, o.hi].some((x) => {
    const y = String(x || '').toLowerCase();
    return y && (y === s || (y.length > 3 && s.includes(y)));
  }));
}

// Returns { valid, value } or { valid:false, err } where err is an i18n key.
export function normalize(field, raw) {
  const v = String(raw ?? '').trim();

  if (field.type === 'select') {
    if (!v) return field.required ? bad('errOption') : ok('');
    const hit = matchOption(field, v);
    return hit ? ok(hit.v) : bad('errOption');
  }
  if (!v) return field.required ? bad('errRequired') : ok('');

  const a = toAscii(v);
  switch (field.type) {
    case 'email': {
      const e = a.replace(/\s+at\s+/gi, '@').replace(/\s+dot\s+/gi, '.').replace(/\s/g, '').toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? ok(e) : bad('errEmail');
    }
    case 'phone': {
      let d = a.replace(/\D/g, '');
      if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
      if (d.length === 11 && d[0] === '0') d = d.slice(1);
      return /^[6-9]\d{9}$/.test(d) ? ok(d) : bad('errPhone');
    }
    case 'pin': {
      const d = a.replace(/\D/g, '');
      return /^[1-9]\d{5}$/.test(d) ? ok(d) : bad('errPin');
    }
    case 'number': {
      const n = a.replace(/[,\s]/g, '');
      return /^\d+(\.\d+)?$/.test(n) ? ok(n) : bad('errNumber');
    }
    case 'date': {
      const d = parseDate(a.trim());
      return d ? ok(d) : bad('errDate');
    }
    case 'sensitive': {
      const s = a.replace(/\s/g, '').toUpperCase();
      return /^\d{12}$/.test(s) || /^[A-Z]{5}\d{4}[A-Z]$/.test(s) ? ok(s) : bad('errSensitive');
    }
    default:
      return ok(v);
  }
}

// ---------- Paste / upload parser ----------
// Turns pasted text into fields. Anything it cannot understand is flagged, never guessed.
export function parseText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);

  return lines.map((line, i) => {
    let question = line;
    let optionsRaw = null;
    const om = line.match(/^(.*?)\s*(?:options?|choices?|विकल्प)\s*[:：]\s*(.+)$/i);
    if (om) { question = om[1] || ''; optionsRaw = om[2]; }

    const lang = /[\u0900-\u097F]/.test(question) ? 'hi' : 'en';
    const optional = /\(optional\)|वैकल्पिक/i.test(question);
    const label = question.replace(/\(optional\)|\(वैकल्पिक\)/gi, '').replace(/\?+\s*$/, '?').trim();

    let type = 'text';
    if (/aadhaar|aadhar|आधार|\bpan\b|bank account|card number/i.test(question)) type = 'sensitive';
    else if (/date|dob|birth|जन्म|तिथि/i.test(question)) type = 'date';
    else if (/e-?mail|ईमेल/i.test(question)) type = 'email';
    else if (/phone|mobile|contact number|मोबाइल|फ़ोन|फोन/i.test(question)) type = 'phone';
    else if (/pin ?code|पिन/i.test(question)) type = 'pin';
    else if (/\b(age|amount|income|marks|quantity|how many|how old)\b/i.test(question)) type = 'number';

    let options = null;
    if (optionsRaw) {
      type = 'select';
      options = optionsRaw.split(/[,;/]/).map((s) => s.trim()).filter(Boolean).map((s) => opt(s, s, s));
    }

    const letters = label.replace(/[^\p{L}]/gu, '').length;
    const flag = letters < 3 || (type === 'select' && (!options || options.length === 0));

    return {
      id: `q${i + 1}`,
      type,
      required: !optional && type !== 'sensitive',
      label: { [lang]: label || line },
      options,
      flag,
      lang,
    };
  });
}

// ---------- Pre-filled link for Google Forms ----------
// Builds a link that opens the real Google Form with the confirmed answers already filled in.
// The user checks it and presses Submit themselves; nothing is ever submitted for them.
// Private ('sensitive') answers are never put in a link, because links stay in browser history.
// Returns { url, filled, left } or null when this form cannot be pre-filled.
// `left` counts answers the user must type in themselves.
export function buildPrefillUrl(form, answers) {
  let u;
  try { u = new URL(form.sourceUrl); } catch { return null; }
  if (u.protocol !== 'https:' || u.hostname !== 'docs.google.com' || !/\/forms\//.test(u.pathname)) return null;
  u.search = '';
  u.hash = '';
  u.pathname = `${u.pathname.replace(/\/(viewform|formResponse|edit|prefill)?\/?$/, '')}/viewform`;
  u.searchParams.set('usp', 'pp_url');

  let filled = 0;
  let left = 0;
  for (const f of form.fields) {
    const v = answers[f.id];
    if (v === undefined || v === null || v === '') continue;
    const key = f.source_key || '';
    if (f.type === 'sensitive' || !/^entry\.\d+$/.test(key)) { left++; continue; }
    if (f.type === 'date') {
      const [y, m, d] = String(v).split('-').map(Number);
      u.searchParams.set(`${key}_year`, String(y));
      u.searchParams.set(`${key}_month`, String(m));
      u.searchParams.set(`${key}_day`, String(d));
    } else {
      u.searchParams.set(key, String(v));
    }
    filled++;
  }
  return filled ? { url: u.href, filled, left } : null;
}

// ---------- PII masking for copied / shared text ----------
export function maskPII(text) {
  return String(text)
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, 'XXXX XXXX XXXX')
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, 'XXXXX0000X')
    .replace(/\b[6-9]\d{9}\b/g, 'XXXXXXXXXX')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email hidden]');
}
