export const PAYMENT_STATUSES = {
  PENDING: 'Pending',
  PAID: 'Paid',
};

export const PAYMENT_PROFILE = {
  payeeName: 'Priti Gupta',
  paymentPhone: '7011120236',
};

export const normalizeIndianWhatsAppNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return null;
};

export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const getInvoiceNumber = (matchId, teamId) =>
  `SA-${String(matchId).slice(-6).toUpperCase()}-${String(teamId).slice(-4).toUpperCase()}`;

export const getTeamCharge = (match, side) => ({
  amount: Number(match?.[`${side}Fee`] || 0),
  status: match?.[`${side}PaymentStatus`] || PAYMENT_STATUSES.PENDING,
  reminderDueAt: match?.[`${side}ReminderDueAt`] || null,
  reminderSentAt: match?.[`${side}ReminderSentAt`] || null,
});

export const buildPaymentReminderMessage = ({ match, team, amount }) => {
  const matchDate = new Date(match.date).toLocaleDateString('en-IN');
  return [
    `Hello ${team.name},`,
    `Your match fee of ${formatCurrency(amount)} is due for ${match.team1Name} vs ${match.team2Name} on ${matchDate}.`,
    `Please pay using the attached/invoice UPI scanner for ${PAYMENT_PROFILE.payeeName} (${PAYMENT_PROFILE.paymentPhone}).`,
    `Invoice: ${getInvoiceNumber(match.id, team.id)}`,
    'Thank you.',
  ].join('\n');
};

export const buildWhatsAppUrl = (phone, message) => {
  const normalizedPhone = normalizeIndianWhatsAppNumber(phone);
  if (!normalizedPhone) return null;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
};
