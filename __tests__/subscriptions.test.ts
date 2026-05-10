import dayjs from 'dayjs';

// ─── Date validation logic (mirrors CreateSubscriptionModal) ──────────────────
function validateCustomDate(month: string, day: string, year: string): dayjs.Dayjs | null {
  const m = parseInt(month);
  const d = parseInt(day);
  const y = parseInt(year);
  if (!m || !d || !y || year.length !== 4) return null;
  const date = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  if (!date.isValid()) return null;
  if (date.month() + 1 !== m || date.date() !== d || date.year() !== y) return null;
  return date;
}

// ─── Insights calculation logic (mirrors insights.tsx) ────────────────────────
function calcMonthly(subscriptions: { price: number; billing: string }[]): number {
  return subscriptions.reduce((sum, s) => {
    if (s.billing === 'Yearly') return sum + s.price / 12;
    return sum + s.price;
  }, 0);
}

// ─── Renewal expiry logic (mirrors SubscriptionsContext) ──────────────────────
function isExpired(renewalDate: string): boolean {
  const startOfToday = dayjs().startOf('day');
  return dayjs(renewalDate).startOf('day').isBefore(startOfToday);
}

// ─── Balance validation (mirrors CreateSubscriptionModal) ─────────────────────
function hasSufficientBalance(price: number, balance: number): boolean {
  return price <= balance;
}


// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Custom date validation', () => {
  it('accepts a valid date', () => {
    expect(validateCustomDate('06', '15', '2027')).not.toBeNull();
  });

  it('rejects Feb 31 (impossible date)', () => {
    expect(validateCustomDate('02', '31', '2027')).toBeNull();
  });

  it('accepts Feb 29 on a leap year', () => {
    expect(validateCustomDate('02', '29', '2028')).not.toBeNull();
  });

  it('rejects Feb 29 on a non-leap year', () => {
    expect(validateCustomDate('02', '29', '2027')).toBeNull();
  });

  it('rejects incomplete year (3 digits)', () => {
    expect(validateCustomDate('06', '15', '202')).toBeNull();
  });

  it('rejects month 13', () => {
    expect(validateCustomDate('13', '01', '2027')).toBeNull();
  });
});


describe('Insights monthly calculation', () => {
  it('counts monthly subscriptions at full price', () => {
    expect(calcMonthly([{ price: 10, billing: 'Monthly' }])).toBe(10);
  });

  it('divides yearly subscriptions by 12', () => {
    expect(calcMonthly([{ price: 120, billing: 'Yearly' }])).toBeCloseTo(10);
  });

  it('includes custom billing at full price', () => {
    expect(calcMonthly([{ price: 15, billing: 'Custom' }])).toBe(15);
  });

  it('sums mixed billing types correctly', () => {
    const subs = [
      { price: 10, billing: 'Monthly' },
      { price: 120, billing: 'Yearly' },
      { price: 5, billing: 'Custom' },
    ];
    expect(calcMonthly(subs)).toBeCloseTo(25);
  });
});


describe('Renewal date expiry', () => {
  it('keeps a subscription renewing today', () => {
    const today = dayjs().startOf('day').toISOString();
    expect(isExpired(today)).toBe(false);
  });

  it('keeps a subscription renewing tomorrow', () => {
    const tomorrow = dayjs().add(1, 'day').toISOString();
    expect(isExpired(tomorrow)).toBe(false);
  });

  it('removes a subscription that expired yesterday', () => {
    const yesterday = dayjs().subtract(1, 'day').toISOString();
    expect(isExpired(yesterday)).toBe(true);
  });
});


describe('Balance validation', () => {
  it('allows a subscription within balance', () => {
    expect(hasSufficientBalance(9.99, 100)).toBe(true);
  });

  it('allows a subscription equal to balance', () => {
    expect(hasSufficientBalance(100, 100)).toBe(true);
  });

  it('blocks a subscription exceeding balance', () => {
    expect(hasSufficientBalance(150, 100)).toBe(false);
  });

  it('blocks when balance is zero', () => {
    expect(hasSufficientBalance(9.99, 0)).toBe(false);
  });
});
