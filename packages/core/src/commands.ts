// Deterministic voice commands for Live Mode. Confirmation is decided here in code, never by the model (D3).
import { normalizeYesNo } from './normalize';
import type { FieldType, Language } from './types';

export type VoiceCommand = 'confirm' | 'reject' | 'repeat' | 'next' | 'previous' | 'skip' | 'explain' | 'stop' | 'finish';

// English, Hindi (Devanagari and romanised) and Marathi. Whole-utterance matches only.
const COMMANDS: [VoiceCommand, RegExp][] = [
  ['confirm', /^((yes|yeah|yep|yup|sure|correct|right|exactly|perfect)( (it is|that'?s (right|correct)|please|correct|confirm))?|that'?s (right|correct|it)|it'?s (right|correct)|confirm( it)?|ok(ay)?|haan( ji)?|haa|ji haan|haan sahi hai|sahi( hai)?|theek( hai)?|bilkul|हाँ( जी)?|हां( जी)?|जी हाँ|जी हां|जी|सही( है)?|हाँ सही है|हां सही है|ठीक( है)?|बिल्कुल|ho|hoy|barobar|हो|होय|बरोबर( आहे)?|ठीक आहे|चालेल|हो बरोबर)$/],
  ['reject', /^(no|nope|wrong|incorrect|edit|change( it)?|that'?s wrong|nahi|nahin|galat|badlo|नहीं|ना|गलत|ग़लत|बदलो|बदलें|गलत है|नाही|चूक|चुकीचं|चुकीचे|बदला|नको|naahi|chuk)$/],
  ['repeat', /^(repeat|again|say (it )?again|pardon|sorry|what\??|come again|dobara|phir se|फिर से|दोबारा|दोहराओ|दोहराएँ|पुन्हा|परत सांगा|पुन्हा सांगा|punha)$/],
  ['next', /^(next|next question|go on|move on|aage|agla|आगे|अगला|अगला प्रश्न|पुढे|पुढचा|पुढचा प्रश्न|pudhe)$/],
  ['previous', /^(previous|back|go back|pichla|peeche|पिछला|पीछे|मागे|मागचा|mage)$/],
  ['skip', /^(skip|skip (it|this)|chhodo|chhod do|छोड़ो|छोड़ें|छोड़ दो|वगळा|सोडा|vagla)$/],
  ['explain', /^(explain|what does (this|that) mean\??|what is (this|that)\??|samjhao|samjhaiye|समझाओ|समझाइए|समझाएँ|मतलब\??|इसका मतलब क्या है\??|समजावून सांगा|म्हणजे काय\??|याचा अर्थ काय\??)$/],
  ['stop', /^(stop|stop listening|pause|ruko|bas|रुको|बस|थांबा|थांब|thamba)$/],
  // Go to the summary now. Never submits: AwaazForm has no way to.
  ['finish', /^(done|i'?m done|finish(ed)?|that'?s all|that is all|that'?s it|fill (it|them|everything|all)( in| now)?|review|ho gaya|bas itna|हो गया|बस इतना|पूरा हुआ|भर दो|झालं|झाले|संपलं|भरा)$/],
];

/** Matches a whole utterance (after trimming punctuation) to a command. Answers never match. */
export function parseVoiceCommand(utterance: string): VoiceCommand | null {
  const v = utterance.normalize('NFC').toLowerCase().trim().replace(/[.!?,।۔؟]+$/u, '').replace(/^(please|kripya|कृपया|कृपा करून) /, '').replace(/[,،]/g, '').replace(/\s+/g, ' ').trim();
  for (const [cmd, re] of COMMANDS) if (re.test(v)) return cmd;
  return null;
}

/** The words to suggest in hints for a language: say “yes” to confirm, “next” to move on… */
export function commandWords(lang: Language): Record<'yes' | 'no' | 'next' | 'repeat' | 'explain', string> {
  if (lang === 'hi') return { yes: 'हाँ', no: 'नहीं', next: 'आगे', repeat: 'फिर से', explain: 'समझाओ' };
  if (lang === 'mr') return { yes: 'हो', no: 'नाही', next: 'पुढे', repeat: 'पुन्हा', explain: 'समजावून सांगा' };
  return { yes: 'yes', no: 'no', next: 'next', repeat: 'repeat', explain: 'explain' };
}

/** Yes/no answers to a yes/no question must not be mistaken for confirmation of a *proposal*. */
export function isPlainYesNo(utterance: string): boolean {
  return normalizeYesNo(utterance) !== null;
}

/** Guesses a field type from a printed label (flat PDFs, AcroForm field names). The user can change it. */
export function guessFieldType(label: string): FieldType {
  const l = label.toLowerCase();
  if (/e-?mail|ईमेल/.test(l)) return 'email';
  if (/mobile|phone|contact no|फ़ोन|फोन|मोबाइल/.test(l)) return 'phone';
  if (/date|\bdob\b|d ?d ?\/ ?m ?m|जन्म तिथि|दिनांक|तारीख/.test(l)) return 'date';
  if (/\bage\b|percentage|number of|no\. of|pin ?code|पिन कोड|आयु/.test(l)) return 'number';
  if (/address|description|remarks|details|पता/.test(l)) return 'paragraph';
  return 'text';
}
