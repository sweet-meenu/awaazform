// Data model — PRD §8.4.

export type FieldType =
  | 'text' | 'paragraph' | 'number' | 'date' | 'time'
  | 'email' | 'phone' | 'yesno' | 'choice' | 'multichoice' | 'checkbox'
  | 'dropdown' | 'scale'
  /** A file the user picks themselves (web pages with a plain file input, through the extension). */
  | 'file'
  /** A signature drawn on screen (printed PDFs). A PNG data URL kept in the local session, never a profile or AI request. */
  | 'signature';

/** A rectangle in PDF user space (points, origin bottom-left), on a 0-based page. */
export interface PdfBox { x: number; y: number; w: number; h: number }

export type FormSource =
  | { kind: 'google-form'; url: string; formId: string; entryId: string }
  /** `prefill`: the owner allows pre-filled links (Microsoft's AllowPrefill setting). */
  | { kind: 'ms-form'; url: string; formId: string; questionId: string; prefill?: boolean }
  /** A question found on a live page by the browser extension; `key` locates it again. */
  | { kind: 'dom'; url: string; key: string; platform: 'google' | 'microsoft' | 'other' }
  | { kind: 'docx'; fileName: string; slot: string }
  | { kind: 'pdf-acroform'; fileName: string; fieldName: string }
  /** `more`: blank lines below the box (e.g. an address's second and third lines) that long answers wrap onto. */
  /** `cells`: a row of character boxes (PRN, mobile number): one character per cell. */
  | { kind: 'pdf-flat'; fileName: string; page: number; box: PdfBox; more?: PdfBox[]; cells?: PdfBox[]; optionBoxes?: Record<string, PdfBox>; uppercase?: boolean }
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

/**
 * Interface and conversation languages: English and the Indian languages Whisper (our speech-to-text)
 * understands. Odia is not among them, so it is not offered.
 */
export const LANGUAGES = ['en', 'hi', 'mr'] as const;
export type Language = (typeof LANGUAGES)[number];

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
  /**
   * Envelope encryption (v2): a random data key encrypts the values; it is stored wrapped (encrypted)
   * by each way of unlocking. v1 profiles have no `wrapped` and use the passphrase key directly.
   */
  wrapped?: {
    /** Data key wrapped with the PBKDF2 passphrase key: `iv.ciphertext`. */
    passphrase?: string;
    /** Data key wrapped with a key derived from a passkey's PRF output (hardware-backed). */
    passkey?: { credentialId: string; prfSalt: string; key: string; createdAt: string };
  };
  fields: Partial<Record<CanonicalKey, ProfileField>>;
}

export const TOOL_NAMES = [
  'scan_form', 'get_current_question', 'ask_user', 'propose_fill', 'read_back',
  'explain_field', 'lookup_profile', 'offer_save', 'highlight_field', 'verify_field', 'build_report', 'go_to_question',
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
