// Data model — PRD §8.4.

export type FieldType =
  | 'text' | 'paragraph' | 'number' | 'date' | 'time'
  | 'email' | 'phone' | 'yesno' | 'choice' | 'multichoice' | 'checkbox'
  | 'dropdown' | 'scale';

/** A rectangle in PDF user space (points, origin bottom-left), on a 0-based page. */
export interface PdfBox { x: number; y: number; w: number; h: number }

export type FormSource =
  | { kind: 'google-form'; url: string; formId: string; entryId: string }
  | { kind: 'pdf-acroform'; fileName: string; fieldName: string }
  | { kind: 'pdf-flat'; fileName: string; page: number; box: PdfBox; optionBoxes?: Record<string, PdfBox>; uppercase?: boolean }
  | { kind: 'fixture'; name: string };

export type SupportStatus = 'supported' | 'limited' | 'manual' | 'unsupported';

export interface FormQuestion {
  id: string;
  label: string;
  helpText?: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  support: SupportStatus;
  /** Why a question is not fully supported, shown in the scanner. */
  supportReason?: string;
  source: FormSource;
}

export type AnswerStatus =
  | 'pending' | 'listening' | 'proposed' | 'confirmed'
  | 'written' | 'verified' | 'skipped' | 'invalid';

export type FillSource = 'spoken' | 'typed' | 'profile';

export interface Answer {
  questionId: string;
  raw: string;
  translated?: string;
  normalized?: string;
  source?: FillSource;
  status: AnswerStatus;
  error?: string;
  updatedAt: string;
}

export type Language = 'en' | 'hi';

export interface Session {
  id: string;
  formTitle: string;
  profileId: string;
  language: Language;
  liveMode: boolean;
  questions: FormQuestion[];
  answers: Record<string, Answer>;
  currentIndex: number;
  createdAt: string;
}

export const CANONICAL_KEYS = [
  'full_name', 'email', 'phone', 'date_of_birth',
  'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
] as const;
export type CanonicalKey = (typeof CANONICAL_KEYS)[number];

export interface ProfileField {
  key: CanonicalKey;
  /** Ciphertext (base64) if the profile is encrypted. */
  value: string;
  confirmedAt: string;
  /** Form titles or file names, for transparency. */
  sources: string[];
}

export interface Profile {
  id: string;
  label: string;
  createdAt: string;
  encrypted: boolean;
  /** Present when encrypted: base64 salt for PBKDF2. */
  salt?: string;
  /** Present when encrypted: a known string encrypted with the key, to check the passphrase. */
  verifier?: string;
  fields: Partial<Record<CanonicalKey, ProfileField>>;
}

export const TOOL_NAMES = [
  'scan_form', 'get_current_question', 'ask_user', 'propose_fill', 'read_back',
  'explain_field', 'lookup_profile', 'offer_save', 'highlight_field', 'verify_field', 'build_report',
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

// Event model — PRD §8.3. The timeline and replica subscribe to these.
export type SessionEvent =
  | { type: 'question.presented'; questionId: string }
  | { type: 'tool.called'; callId: string; name: ToolName; args: unknown }
  | { type: 'tool.result'; callId: string; name: ToolName; ok: boolean; summary: string }
  | { type: 'fill.proposed'; questionId: string; value: string; source: FillSource }
  | { type: 'fill.confirmed'; questionId: string; value: string }
  | { type: 'fill.written'; questionId: string; value: string }
  | { type: 'fill.verified'; questionId: string; ok: boolean; actual?: string }
  | { type: 'profile.offered'; key: CanonicalKey }
  | { type: 'profile.saved'; key: CanonicalKey }
  | { type: 'error'; message: string; recoverable: boolean };
