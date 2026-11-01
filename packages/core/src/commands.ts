// Deterministic voice commands for Live Mode. Confirmation is decided here in code, never by the model (D3).
import { normalizeYesNo } from './normalize';
import type { FieldType } from './types';

export type VoiceCommand = 'confirm' | 'reject' | 'repeat' | 'next' | 'previous' | 'skip' | 'explain' | 'stop';

const COMMANDS: [VoiceCommand, RegExp][] = [
  ['confirm', /^(yes|yeah|yep|correct|right|that'?s right|confirm|ok(ay)?|haan|haa|ji haan|sahi( hai)?|theek( hai)?|हाँ|हां|जी हाँ|जी|सही( है)?|ठीक( है)?)$/],
  ['reject', /^(no|nope|wrong|edit|change( it)?|nahi|nahin|galat|badlo|नहीं|ना|गलत|ग़लत|बदलो|बदलें)$/],
  ['repeat', /^(repeat|again|say (it )?again|pardon|what\??|dobara|phir se|फिर से|दोबारा|दोहराओ|दोहराएँ)$/],
  ['next', /^(next|next question|aage|agla|आगे|अगला|अगला प्रश्न)$/],
  ['previous', /^(previous|back|go back|pichla|peeche|पिछला|पीछे)$/],
  ['skip', /^(skip|skip (it|this)|chhodo|chhod do|छोड़ो|छोड़ें|छोड़ दो)$/],
  ['explain', /^(explain|what does (this|that) mean\??|samjhao|samjhaiye|समझाओ|समझाइए|समझाएँ|मतलब\??)$/],
  ['stop', /^(stop|stop listening|pause|ruko|bas|रुको|बस)$/],
];

/** Matches a whole utterance (after trimming punctuation) to a command. Answers never match. */
export function parseVoiceCommand(utterance: string): VoiceCommand | null {
  const v = utterance.normalize('NFC').toLowerCase().trim().replace(/[.!?,।]+$/u, '').replace(/^(please|kripya|कृपया) /, '').trim();
  for (const [cmd, re] of COMMANDS) if (re.test(v)) return cmd;
  return null;
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
