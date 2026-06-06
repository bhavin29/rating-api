import { randomInt } from 'crypto';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generatePin(): string {
  const char1 = LETTERS[randomInt(0, 26)];
  const char2 = LETTERS[randomInt(0, 26)];
  const digits = randomInt(1000, 10000).toString(); // always 4 digits
  return `${char1}${char2}${digits}`;
}

export function pinExpiresAt(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date;
}
