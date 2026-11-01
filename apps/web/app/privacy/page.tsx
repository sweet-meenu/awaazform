import { Reveal } from '@/components/Motion';

export const metadata = { title: 'Privacy · AwaazForm' };

// PRD §7, §9.2, §9.4. Keep this page in step with the actual data flows.
export default function PrivacyPage() {
  return (
    <div className="container-x max-w-3xl py-12">
      <Reveal><h1 className="text-[clamp(1.75rem,3vw,2.5rem)]">Privacy</h1></Reveal>
      <p className="mt-3 text-muted">In short: your details stay in your browser. The only thing that leaves it is what is needed to understand your voice and reply.</p>

      <Section title="Stored in your browser only">
        <li><b>Profiles and saved details</b> (name, email, phone, date of birth, address), only after you said yes to saving each one. Kept in IndexedDB until you delete them on the Profiles page.</li>
        <li><b>The current session</b> (questions and answers), kept in local storage so a reload does not lose your work. Use “Discard session” to clear it.</li>
        <li><b>Settings</b> such as language and contrast.</li>
      </Section>

      <Section title="Never saved">
        <li>Passwords, PINs, OTPs, card or bank account numbers.</li>
        <li>Government ID numbers (Aadhaar, PAN, passport, driving licence, voter ID).</li>
        <li>Health information, religion, caste, sexual orientation, political views, immigration status.</li>
        <li>Audio recordings. Audio is discarded after transcription and is never written to disk.</li>
      </Section>

      <Section title="Sent to Groq, and why">
        <li><b>When you answer by voice:</b> the short audio clip, to be transcribed.</li>
        <li><b>When AI help is used:</b> the current question, its help text, your latest answer, and a minimal summary of the session. Your full profile is never sent. A saved detail is sent only after you agree to use it.</li>
        <li><b>For read-back</b>, if server text-to-speech is configured: the sentence being read aloud. Otherwise your browser&apos;s own voice is used and nothing is sent.</li>
        <li>Groq&apos;s own retention rules apply to what it receives. Check <a className="underline" href="https://groq.com/privacy-policy/" rel="noreferrer">Groq&apos;s privacy policy</a> before real-world use.</li>
      </Section>

      <Section title="Our server">
        <li><b>Google Form links:</b> when you paste one, the server fetches that public form from Google to read its questions. Your answers never pass through the server; they go into a pre-filled link that opens in your own browser.</li>
        <li>The server only relays requests to Groq. It stores nothing and does not log request bodies.</li>
        <li>The Groq API key lives only on the server and is never sent to your browser or the extension.</li>
      </Section>

      <Section title="Live Mode">
        <li>Live Mode is off by default and is not yet built. When it is, it will ask first, and it will send your voice and the current question to Groq for as long as it is on.</li>
      </Section>

      <Section title="How to delete everything">
        <li>Profiles page → “Forget everything”. Session page → “Discard session”. Or clear this site&apos;s data in your browser settings.</li>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xl">{title}</h2>
      <ul className="grid list-disc gap-2 pl-5 text-sm leading-relaxed">{children}</ul>
    </section>
  );
}
