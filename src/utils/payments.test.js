import {
  buildPaymentReminderMessage,
  buildWhatsAppUrl,
  formatCurrency,
  normalizeIndianWhatsAppNumber,
} from './payments';

describe('payment utilities', () => {
  test('normalizes Indian WhatsApp numbers', () => {
    expect(normalizeIndianWhatsAppNumber('98765 43210')).toBe('919876543210');
    expect(normalizeIndianWhatsAppNumber('+91 98765-43210')).toBe('919876543210');
    expect(normalizeIndianWhatsAppNumber('123')).toBeNull();
  });

  test('builds an encoded WhatsApp reminder', () => {
    const match = {
      id: 'match-123456',
      date: '2026-09-08T17:00:00.000Z',
      team1Name: 'Eagles',
      team2Name: 'Tigers',
    };
    const message = buildPaymentReminderMessage({
      match,
      team: { id: 'team-1', name: 'Eagles' },
      amount: 5500,
    });
    const url = buildWhatsAppUrl('9876543210', message);

    expect(message).toContain(formatCurrency(5500));
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
  });
});
