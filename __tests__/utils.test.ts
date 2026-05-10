import { formatCurrency, formatSubscriptionDateTime, formatStatusLabel } from '../lib/utils';

describe('formatCurrency', () => {
  it('formats a positive number as USD', () => {
    expect(formatCurrency(9.99)).toBe('$9.99');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts with commas', () => {
    expect(formatCurrency(2489.48)).toBe('$2,489.48');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
  });
});

describe('formatSubscriptionDateTime', () => {
  it('formats a valid ISO date string', () => {
    expect(formatSubscriptionDateTime('2026-06-15T00:00:00.000Z')).toBe('06/15/2026');
  });

  it('returns "Not provided" for undefined', () => {
    expect(formatSubscriptionDateTime(undefined)).toBe('Not provided');
  });

  it('returns "Not provided" for an invalid date string', () => {
    expect(formatSubscriptionDateTime('not-a-date')).toBe('Not provided');
  });
});

describe('formatStatusLabel', () => {
  it('capitalizes the first letter', () => {
    expect(formatStatusLabel('active')).toBe('Active');
  });

  it('returns "Unknown" for undefined', () => {
    expect(formatStatusLabel(undefined)).toBe('Unknown');
  });

  it('handles already capitalized input', () => {
    expect(formatStatusLabel('Monthly')).toBe('Monthly');
  });
});
