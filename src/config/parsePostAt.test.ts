import { describe, expect, it } from 'vitest';
import { parsePostAt } from '@/config/parsePostAt';

describe(parsePostAt, () => {
  it.each([
    { value: '2027-01-04T09:00', expected: '2027-01-04T14:00:00.000Z' },
    { value: '2027-01-04 09:00', expected: '2027-01-04T14:00:00.000Z' },
    { value: '2027-01-04 9:00am', expected: '2027-01-04T14:00:00.000Z' },
    { value: '2027-01-04 9:00 PM', expected: '2027-01-05T02:00:00.000Z' },
    { value: 'Jan 4, 2027 9:00am', expected: '2027-01-04T14:00:00.000Z' },
    { value: 'January 4, 2027 9:00 am', expected: '2027-01-04T14:00:00.000Z' },
    { value: 'Jan 4 2027 9:00am', expected: '2027-01-04T14:00:00.000Z' },
    { value: '2027-01-04', expected: '2027-01-04T05:00:00.000Z' },
    // An offset in the value wins over the config's timezone
    { value: '2027-01-04T09:00-08:00', expected: '2027-01-04T17:00:00.000Z' },
  ])('reads "$value" in the config timezone', ({ value, expected }) => {
    expect(parsePostAt(value, 'America/New_York')?.toISOString()).toBe(
      expected
    );
  });

  it('uses UTC when the config has no timezone', () => {
    expect(parsePostAt('2027-01-04 9:00am', null)?.toISOString()).toBe(
      '2027-01-04T09:00:00.000Z'
    );
  });

  it.each([
    { value: 'next tuesday' },
    { value: '01/04/2027' },
    { value: '2027-13-04' },
  ])('returns null for "$value"', ({ value }) => {
    expect(parsePostAt(value, 'America/New_York')).toBeNull();
  });
});
