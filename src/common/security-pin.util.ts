import { randomInt } from 'crypto';

export function generatePin(): string {
  return randomInt(100000, 1000000).toString();
}
