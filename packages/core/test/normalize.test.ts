import { describe, expect, it } from 'vitest';
import {
  matchOption, normalizeDate, normalizeEmail, normalizeNumber, normalizePhone,
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
