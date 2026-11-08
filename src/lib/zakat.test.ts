/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateZakat, parseAmount, type ZakatInput } from './zakat.ts';

const base: ZakatInput = {
  cash: 0,
  goldGrams: 0,
  goldPricePerGram: 100,
  silverGrams: 0,
  silverPricePerGram: 1,
  investments: 0,
  business: 0,
  owedToYou: 0,
  debts: 0,
  nisabBasis: 'silver',
  fullYear: true,
};

test('2.5% is owed above the silver nisab after a full year', () => {
  const r = calculateZakat({ ...base, cash: 10_000 });
  assert.deepEqual(r, { status: 'owed', total: 10_000, nisab: 595, zakat: 250 });
});

test('gold nisab is 85 g', () => {
  const r = calculateZakat({ ...base, nisabBasis: 'gold', cash: 8_000 });
  assert.ok(r.status === 'below-nisab');
  assert.equal(r.nisab, 8_500);
});

test('counts gold, silver, investments, business and money owed, minus debts', () => {
  const r = calculateZakat({ ...base, cash: 1000, goldGrams: 10, silverGrams: 100, investments: 500, business: 200, owedToYou: 300, debts: 1000 });
  // 1000 + 1000 + 100 + 500 + 200 + 300 - 1000
  assert.equal(r.status, 'owed');
  if (r.status === 'owed') {
    assert.equal(r.total, 2100);
    assert.equal(r.zakat, 52.5);
  }
});

test('not due until a lunar year has passed', () => {
  assert.equal(calculateZakat({ ...base, cash: 10_000, fullYear: false }).status, 'not-yet');
});

test('asks for the price when it is missing', () => {
  assert.deepEqual(calculateZakat({ ...base, goldGrams: 5, goldPricePerGram: 0 }), { status: 'need-price', metal: 'gold' });
  assert.deepEqual(calculateZakat({ ...base, silverPricePerGram: 0, cash: 5 }), { status: 'need-price', metal: 'silver' });
});

test('debts never make the total negative', () => {
  const r = calculateZakat({ ...base, cash: 100, debts: 5000 });
  assert.ok(r.status === 'below-nisab');
  assert.equal(r.total, 0);
});

test('reads typed amounts', () => {
  assert.equal(parseAmount('12,500.50'), 12500.5);
  assert.equal(parseAmount(''), 0);
  assert.equal(parseAmount('-4'), 0);
});
