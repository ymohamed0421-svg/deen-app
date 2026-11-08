/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatCode,
  friendlyError,
  inviteLink,
  inviteMessage,
  normalizeCode,
  nudgeOptions,
  sortFriends,
  statusLine,
  type Friend,
} from './friendsLogic.ts';

const base: Friend = {
  friend_id: 'a',
  name: 'Amina',
  streak: 4,
  studied_today: false,
  prayers_today: null,
  buddy_streak: 0,
  nudged_pray: false,
  nudged_study: false,
};

test('cleans typed and pasted friend codes', () => {
  assert.equal(normalizeCode('abc 234'), 'ABC234');
  assert.equal(normalizeCode(' k7p-q9x '), 'K7PQ9X');
  assert.equal(normalizeCode('https://ymohamed0421-svg.github.io/deen-app/friends?code=K7PQ9X'), 'K7PQ9X');
  assert.equal(normalizeCode('Tap to add me: https://x.io/friends?code=k7pq9x Or enter'), 'K7PQ9X');
  assert.equal(normalizeCode('ABCDEFGH'), 'ABCDEF');
});

test('formats codes and invite links', () => {
  assert.equal(formatCode('K7PQ9X'), 'K7P Q9X');
  assert.equal(inviteLink('K7PQ9X'), 'https://ymohamed0421-svg.github.io/deen-app/friends?code=K7PQ9X');
  assert.match(inviteMessage('K7PQ9X', 'Youssef'), /Youssef wants/);
  assert.match(inviteMessage('K7PQ9X', null), /K7P Q9X/);
  assert.equal(normalizeCode(inviteMessage('K7PQ9X', 'Sam')), 'K7PQ9X');
});

test('only offers nudges for what is still left today', () => {
  assert.deepEqual(nudgeOptions(base), ['pray', 'study']);
  assert.deepEqual(nudgeOptions({ ...base, studied_today: true, prayers_today: 3 }), ['pray']);
  assert.deepEqual(nudgeOptions({ ...base, prayers_today: 5 }), ['study']);
  assert.deepEqual(nudgeOptions({ ...base, studied_today: true, prayers_today: 5 }), []);
});

test('describes a friend’s day', () => {
  assert.equal(statusLine(base), '⏳ Hasn’t studied yet');
  assert.equal(statusLine({ ...base, studied_today: true, prayers_today: 2 }), '✅ Studied today · 🕌 2/5 prayers');
  assert.equal(statusLine({ ...base, prayers_today: 5 }), '⏳ Hasn’t studied yet · 🕌 All 5 prayers');
});

test('puts friends with something left today first', () => {
  const done = { ...base, friend_id: 'd', name: 'Bilal', studied_today: true, prayers_today: 5 };
  const buddy = { ...base, friend_id: 'b', name: 'Zaid', buddy_streak: 9 };
  assert.deepEqual(sortFriends([done, base, buddy]).map((f) => f.name), ['Zaid', 'Amina', 'Bilal']);
});

test('explains errors in plain words', () => {
  assert.match(friendlyError('No one has that friend code'), /Check it/);
  assert.match(friendlyError('That\'s your own friend code'), /your own/);
  assert.match(friendlyError('TypeError: Failed to fetch'), /internet/);
  assert.match(friendlyError('Could not find the function public.my_friends'), /switched on/);
});
