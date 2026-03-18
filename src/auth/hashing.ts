import { createHash } from 'crypto';

export function generateSapisidHash(sapisid: string, origin: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp} ${sapisid} ${origin}`;
  const hash = createHash('sha1').update(payload).digest('hex');
  return `${timestamp}_${hash}`;
}
