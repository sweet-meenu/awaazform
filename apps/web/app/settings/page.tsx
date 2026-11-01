'use client';

import { useEffect, useState } from 'react';
import { Reveal } from '@/components/Motion';
import { useSettings, type Settings } from '@/lib/settings';
import { speak } from '@/lib/voice';

// FR-28, FR-47 – FR-49.
export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const load = () => setVoices(speechSynthesis.getVoices().filter((v) => /^(en|hi)/i.test(v.lang)));
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  return (
    <div className="container-x max-w-2xl py-12">
      <Reveal><h1 className="text-[clamp(1.75rem,3vw,2.5rem)]">Settings</h1></Reveal>
      <p className="mt-2 text-muted">Saved in this browser.</p>

      <div className="mt-8 grid gap-6">
        <Choice legend="Language" value={settings.language} onChange={(v) => update({ language: v as Settings['language'] })}
          options={[['en', 'English'], ['hi', 'हिन्दी (Hindi)']]} />
        <Choice legend="Contrast" value={settings.contrast} onChange={(v) => update({ contrast: v as Settings['contrast'] })}
          options={[['normal', 'Standard'], ['high', 'High contrast']]} />
        <Choice legend="Text size" value={settings.text} onChange={(v) => update({ text: v as Settings['text'] })}
          options={[['normal', 'Standard'], ['large', 'Large text']]} />
        <Choice legend="Motion" value={settings.motion} onChange={(v) => update({ motion: v as Settings['motion'] })}
          options={[['system', 'Follow my device'], ['reduce', 'Reduce motion']]} hint="Reduce motion replaces typing and gliding animations with instant changes. Text and check marks stay." />

        <fieldset className="card grid gap-4 p-6">
          <legend className="px-1 text-lg font-semibold">Voice</legend>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Speech speed: {settings.speechRate.toFixed(1)}×</span>
            <input type="range" min={0.6} max={1.6} step={0.1} value={settings.speechRate} onChange={(e) => update({ speechRate: Number(e.target.value) })} className="h-11" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Browser voice</span>
            <select className="field-input" value={settings.voiceURI} onChange={(e) => update({ voiceURI: e.target.value })}>
              <option value="">Automatic</option>
              {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
            {voices.length === 0 && <span className="text-xs text-muted">No voices reported by this browser. For Hindi, install a Hindi voice in your operating system.</span>}
          </label>
          <button type="button" className="btn btn-ghost w-fit"
            onClick={() => speak(settings.language === 'hi' ? 'नमस्ते, मैं AwaazForm हूँ।' : 'Hello, I am AwaazForm.', { language: settings.language, rate: settings.speechRate, voiceURI: settings.voiceURI })}>
            Test voice
          </button>
        </fieldset>
      </div>
    </div>
  );
}

function Choice({ legend, value, onChange, options, hint }: { legend: string; value: string; onChange: (v: string) => void; options: [string, string][]; hint?: string }) {
  return (
    <fieldset className="card grid gap-3 p-6">
      <legend className="px-1 text-lg font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className={`chip !min-h-11 cursor-pointer !px-4 !text-sm ${value === v ? 'chip-accent' : ''}`}>
            <input type="radio" name={legend} value={v} checked={value === v} onChange={() => onChange(v)} className="h-4 w-4" /> {l}
          </label>
        ))}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </fieldset>
  );
}
