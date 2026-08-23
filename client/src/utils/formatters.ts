export const formatCurrency = (amount: number, lang: string = 'en'): string => {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const currency = lang === 'ar' ? 'EGP' : 'USD';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const formatNumber = (value: number, lang: string = 'en'): string => {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return value.toString();
  }
};

export const formatDateTime = (dateString: string | Date, lang: string = 'en'): string => {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return String(dateString);
  }
};
