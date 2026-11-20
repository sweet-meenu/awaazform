import { describe, expect, it } from 'vitest';
import {
  cleanSpokenAnswer, leadingYesNo, matchOption, matchOptions, normalizeDate, normalizeEmail, normalizeNumber, normalizePhone,
  normalizeTime, normalizeYesNo, toAsciiDigits,
} from '../src/normalize';

describe('normalizers', () => {
  it('converts Hindi digits', () => {
    expect(toAsciiDigits('१२/०३/२००१')).toBe('12/03/2001');
    expect(normalizeNumber('३५')).toBe('35');
    expect(normalizeNumber('1,200')).toBe('1200');
    expect(normalizeNumber('four')).toBeNull();
  });

  it('reads yes/no in English and Hindi', () => {
    expect(normalizeYesNo('हाँ')).toBe('Yes');
    expect(normalizeYesNo('Haan')).toBe('Yes');
    expect(normalizeYesNo('नहीं।')).toBe('No');
    expect(normalizeYesNo('maybe')).toBeNull();
  });

  it('parses dates day-first and with month names, never guessing', () => {
    expect(normalizeDate('12/03/2001')).toBe('2001-03-12');
    expect(normalizeDate('12 March 2001')).toBe('2001-03-12');
    expect(normalizeDate('१२ मार्च २००१')).toBe('2001-03-12');
    expect(normalizeDate('March 12th, 2001')).toBe('2001-03-12');
    expect(normalizeDate('2001-03-12')).toBe('2001-03-12');
    expect(normalizeDate('31/02/2001')).toBeNull();
    expect(normalizeDate('next tuesday')).toBeNull();
  });

  it('parses times and refuses ambiguous ones', () => {
    expect(normalizeTime('10:30 am')).toBe('10:30');
    expect(normalizeTime('2 pm')).toBe('14:00');
    expect(normalizeTime('5')).toBeNull();
  });

  it('normalizes phones and spoken emails', () => {
    expect(normalizePhone('98440 12345')).toBe('9844012345');
    expect(normalizePhone('+91 98440-12345')).toBe('+919844012345');
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizeEmail('Ayush at the rate gmail dot com')).toBe('ayush@gmail.com');
    expect(normalizeEmail('kathon@example.com')).toBe('kathon@example.com');
  });

  it('matches options exactly or by unique prefix only', () => {
    expect(matchOption('sunday', ['Saturday', 'Sunday'])).toBe('Sunday');
    expect(matchOption('s', ['Saturday', 'Sunday'])).toBeNull();
    expect(matchOption('eye', ['Eye check-up', 'Dental'])).toBe('Eye check-up');
  });
});

describe('choosing options by voice', () => {
  const days = ['Saturday', 'Sunday'];
  const roles = ['Student', 'Teacher', 'Working professional', 'Other'];
  it('reads positions in English, Hindi and Marathi', () => {
    expect(matchOption('the second one', roles)).toBe('Teacher');
    expect(matchOption('option 3', roles)).toBe('Working professional');
    expect(matchOption('दूसरा', roles)).toBe('Teacher');
    expect(matchOption('दूसरा वाला', roles)).toBe('Teacher');
    expect(matchOption('पहिला', roles)).toBe('Student');
    expect(matchOption('B', roles)).toBe('Teacher');
    expect(matchOption('last one', roles)).toBe('Other');
    expect(matchOption('9', roles)).toBeNull();
  });
  it('reads numbers on scales as values, not positions', () => {
    expect(matchOption('three', ['1', '2', '3', '4', '5'])).toBe('3');
    expect(matchOption('तीन', ['1', '2', '3', '4', '5'])).toBe('3');
  });
  it('finds an option named in a sentence, unless negated', () => {
    expect(matchOption('I am a student', roles)).toBe('Student');
    expect(matchOption("I'm a working professional", roles)).toBe('Working professional');
    expect(matchOption('I am not a student', roles)).toBeNull();
    expect(matchOption('Sunday.', days)).toBe('Sunday');
  });
  it('maps common Hindi and Marathi words to English options', () => {
    expect(matchOption('महिला', ['Male', 'Female', 'Other'])).toBe('Female');
    expect(matchOption('पुरुष', ['Male', 'Female', 'Other'])).toBe('Male');
    expect(matchOption('मी विद्यार्थी आहे', roles)).toBe('Student');
  });
  it('tolerates small transcription slips but not guesses', () => {
    expect(matchOption('Saterday', days)).toBe('Saturday');
    expect(matchOption('Monday', days)).toBeNull();
    expect(matchOption('s', days)).toBeNull();
  });
  it('reads multi-select answers', () => {
    const checks = ['Eye check-up', 'Blood pressure, sugar', 'Dental'];
    expect(matchOptions('dental and eye check-up', checks)).toEqual(['Eye check-up', 'Dental']);
    expect(matchOptions('Eye check-up, Blood pressure, sugar', checks)).toEqual(['Eye check-up', 'Blood pressure, sugar']);
    expect(matchOptions('पहला और तीसरा', checks)).toEqual(['Eye check-up', 'Dental']);
    expect(matchOptions('all of them', checks)).toEqual(checks);
    expect(matchOptions('सगळे', checks)).toEqual(checks);
    expect(matchOptions('dental and haircut', checks)).toBeNull();
  });
  it('reads yes/no at the start of a sentence, in Marathi too', () => {
    expect(leadingYesNo('Yes, I do')).toBe('Yes');
    expect(leadingYesNo('हो')).toBe('Yes');
    expect(leadingYesNo('नाही')).toBe('No');
    expect(leadingYesNo('ji nahi')).toBe('No');
    expect(leadingYesNo('maybe')).toBeNull();
  });
});

describe('cleanSpokenAnswer', () => {
  it('takes the value out of a sentence', () => {
    expect(cleanSpokenAnswer('text', 'My name is Ayush Shukla.')).toBe('Ayush Shukla');
    expect(cleanSpokenAnswer('text', "I'm Ayush Shukla")).toBe('Ayush Shukla');
    expect(cleanSpokenAnswer('text', 'मेरा नाम आयुष शुक्ला है')).toBe('आयुष शुक्ला');
    expect(cleanSpokenAnswer('text', 'माझं नाव आयुष शुक्ला')).toBe('आयुष शुक्ला');
    expect(cleanSpokenAnswer('text', 'Ayush Shukla')).toBe('Ayush Shukla');
    expect(cleanSpokenAnswer('paragraph', 'I am happy with the teachers.')).toBe('I am happy with the teachers');
  });
  it('rebuilds spoken emails', () => {
    expect(cleanSpokenAnswer('email', 'I use shukla at gmail.com.')).toBe('shukla@gmail.com');
    expect(cleanSpokenAnswer('email', 'my email is ayush dot shukla at gmail dot com')).toBe('shukla@gmail.com'.replace('shukla', 'ayush.shukla'));
    expect(cleanSpokenAnswer('email', 'a y u s h at the rate gmail dot com')).toBe('ayush@gmail.com');
    expect(cleanSpokenAnswer('email', 'ayush underscore 99 at yahoo dot co dot in')).toBe('ayush_99@yahoo.co.in');
    expect(cleanSpokenAnswer('email', 'मेरा ईमेल ayush एट gmail डॉट com है')).toBe('ayush@gmail.com');
    expect(cleanSpokenAnswer('email', 'It is ayush@example.com')).toBe('ayush@example.com');
  });
  it('pulls numbers and phones out of sentences', () => {
    expect(cleanSpokenAnswer('phone', 'my number is 98440 12345')).toBe('98440 12345');
    expect(cleanSpokenAnswer('number', 'I am 32 years old')).toBe('32');
  });
});

describe('Live Mode turn-taking helpers', () => {
  it('notices unfinished sentences', async () => {
    const { looksUnfinished } = await import('../src');
    expect(looksUnfinished('my email is')).toBe(true);
    expect(looksUnfinished('Ayush and')).toBe(true);
    expect(looksUnfinished('मेरा नाम')).toBe(true);
    expect(looksUnfinished('Ayush Shukla')).toBe(false);
    expect(looksUnfinished('मेरा नाम आयुष है')).toBe(false);
  });
  it('answers clear short replies without the AI', async () => {
    const { quickValue } = await import('../src');
    expect(quickValue('email', 'my email is ayush dot shukla at gmail dot com')).toBe('ayush.shukla@gmail.com');
    expect(quickValue('phone', 'it is 98440 12345')).toBe('98440 12345');
    expect(quickValue('text', 'My name is Ayush Shukla')).toBe('Ayush Shukla');
    // Other languages: a short Latin transcript may be a romanised sentence; the AI picks the name out.
    expect(quickValue('text', 'majhe naav Ayush aahe', 'mr')).toBeNull();
    expect(quickValue('text', 'Ayush Shukla', 'hi')).toBeNull();
    expect(quickValue('phone', '98440 12345', 'mr')).toBe('98440 12345');
    expect(quickValue('text', 'मेरा नाम आयुष है')).toBeNull(); // needs romanising: the AI does that
    expect(quickValue('text', "I'm Ayush and my email is a at b dot com")).toBeNull(); // several answers
    expect(quickValue('paragraph', 'Great teachers')).toBeNull();
  });
});

describe('emails and names, as Indians say them', async () => {
  const { extractEmail, fixEmailDomain, emailUsername, spokenEmail, cleanSpokenAnswer, quickValue } = await import('../src');
  it('reads spoken emails in English, Hindi and Marathi', () => {
    expect(extractEmail('my email is ayush shukla at the rate gmail dot com')).toBe('ayushshukla@gmail.com');
    expect(extractEmail('ayush dot shukla at gmail')).toBe('ayush.shukla@gmail.com');
    expect(extractEmail('a for apple y u s h 98 at gmail.com')).toBe('ayush98@gmail.com');
    expect(extractEmail('double a r t i at yahoo dot com')).toBe('aarti@yahoo.com');
    expect(extractEmail('मेरा ईमेल ayush एट द रेट जीमेल डॉट कॉम है')).toBe('ayush@gmail.com');
    expect(extractEmail('ayush shukla gmail dot com')).toBe('ayushshukla@gmail.com'); // no "at" heard
    expect(extractEmail('Emsra edry')).toBeNull();
  });
  it('fixes common domain slips', () => {
    expect(fixEmailDomain('ayush@gmial.com')).toBe('ayush@gmail.com');
    expect(fixEmailDomain('ayush@gmail.co')).toBe('ayush@gmail.com');
    expect(fixEmailDomain('ayush@gmail.con')).toBe('ayush@gmail.com');
    expect(fixEmailDomain('ayush@college.edu.in')).toBe('ayush@college.edu.in');
    expect(cleanSpokenAnswer('email', 'ayush@gmial.com')).toBe('ayush@gmial.com'); // typed as is; the read-back shows it
  });
  it('keeps a username said on its own, so the provider can be asked', () => {
    expect(emailUsername('ayush shukla')).toBe('ayushshukla');
    expect(emailUsername('a y u s h 9 8')).toBe('ayush98');
    expect(emailUsername('my email is ayush underscore shukla')).toBe('ayush_shukla');
    expect(emailUsername('ayush at gmail dot com')).toBeNull();
  });
  it('recognises a provider named on its own', async () => {
    const { emailProvider } = await import('../src');
    expect(emailProvider('Gmail')).toBe('gmail.com');
    expect(emailProvider('जीमेल')).toBe('gmail.com');
    expect(emailProvider('yahoo dot com')).toBe('yahoo.com');
    expect(emailProvider('my name is Ayush')).toBeNull();
  });
  it('reads emails back letter by letter', () => {
    expect(spokenEmail('ayush.s@gmail.com')).toBe('a y u s h dot s, at gmail dot com');
  });
  it('takes names out of sentences in all three languages, without the AI when clear', () => {
    expect(quickValue('text', 'majhe naav Ayush aahe', 'mr', 'Name of the Student')).toBe('Ayush');
    expect(quickValue('text', 'mera naam Ayush Shukla hai', 'hi', 'Full name')).toBe('Ayush Shukla');
    expect(quickValue('text', 'Ayush Shukla', 'hi', 'Full name')).toBe('Ayush Shukla');
    expect(quickValue('text', 'Magenah O Ayush Aye', 'mr', 'Name of the Student')).toBeNull(); // unclear: AI
    expect(quickValue('text', 'Borivali East', 'mr', 'Address')).toBeNull(); // not a name: AI corrects places
  });
});
