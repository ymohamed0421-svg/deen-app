/**
 * Zakat on money, gold and silver, using the common figures:
 * - 2.5% of what you own, once you have had at least the nisab for a lunar year.
 * - Nisab is the value of 85 g of gold or 595 g of silver.
 * Scholars differ on details (which nisab, jewellery, debts), so the app
 * always says to check with a scholar.
 */

export const ZAKAT_RATE = 0.025;
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;

export type ZakatInput = {
  cash: number; // cash at home and in bank accounts
  goldGrams: number;
  goldPricePerGram: number;
  silverGrams: number;
  silverPricePerGram: number;
  investments: number; // shares, funds, crypto and other savings you could sell
  business: number; // goods held for sale in a business
  owedToYou: number; // money people owe you that you expect to get back
  debts: number; // what you owe and must pay now (bills, payments due)
  nisabBasis: 'gold' | 'silver';
  fullYear: boolean; // had at least the nisab for a whole lunar year
};

export type ZakatResult =
  | { status: 'need-price'; metal: 'gold' | 'silver' }
  | {
      status: 'owed' | 'below-nisab' | 'not-yet';
      total: number; // everything counted, minus debts
      nisab: number;
      zakat: number; // 0 unless status is 'owed'
    };

const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);

export function calculateZakat(input: ZakatInput): ZakatResult {
  const goldValue = n(input.goldGrams) * n(input.goldPricePerGram);
  const silverValue = n(input.silverGrams) * n(input.silverPricePerGram);

  if (n(input.goldGrams) > 0 && !n(input.goldPricePerGram)) return { status: 'need-price', metal: 'gold' };
  if (n(input.silverGrams) > 0 && !n(input.silverPricePerGram)) return { status: 'need-price', metal: 'silver' };

  const nisabPrice = input.nisabBasis === 'gold' ? n(input.goldPricePerGram) : n(input.silverPricePerGram);
  if (!nisabPrice) return { status: 'need-price', metal: input.nisabBasis };
  const nisab = (input.nisabBasis === 'gold' ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS) * nisabPrice;

  const assets = n(input.cash) + goldValue + silverValue + n(input.investments) + n(input.business) + n(input.owedToYou);
  const total = Math.max(0, assets - n(input.debts));

  if (total < nisab) return { status: 'below-nisab', total, nisab, zakat: 0 };
  if (!input.fullYear) return { status: 'not-yet', total, nisab, zakat: 0 };
  return { status: 'owed', total, nisab, zakat: round2(total * ZAKAT_RATE) };
}

export function round2(x: number) {
  return Math.round(x * 100) / 100;
}

/** Reads a number the user typed, allowing commas like "12,500.50". */
export function parseAmount(text: string) {
  const v = parseFloat(text.replace(/[,\s]/g, ''));
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function formatMoney(x: number, symbol: string) {
  const s = x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol}${s}`;
}
