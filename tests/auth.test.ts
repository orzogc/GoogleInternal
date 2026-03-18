import { describe, it, expect, vi } from 'vitest';
import { generateSapisidHash } from '../src/auth/hashing';
import { parseCookies } from '../src/auth/cookies';

describe('Auth Module', () => {
  describe('generateSapisidHash', () => {
    it('should generate a valid SAPISIDHASH', () => {
      // Mock Date.now() to 1679140800000 (2023-03-18 12:00:00 UTC)
      const mockTimestamp = 1679140800000;
      vi.setSystemTime(mockTimestamp);

      const sapisid = 'test-sapisid';
      const origin = 'https://www.google.com';
      const hash = generateSapisidHash(sapisid, origin);

      // Expected values for 1679140800, 'test-sapisid', 'https://www.google.com'
      // payload: "1679140800 test-sapisid https://www.google.com"
      // sha1: "888697914c818022b7245749f76a591e1360091d"
      const expectedTimestamp = 1679140800;
      const expectedHash = 'c09fdce69dc54895aa256e284fa70c6d6369cec8';
      expect(hash).toBe(`${expectedTimestamp}_${expectedHash}`);

      vi.useRealTimers();
    });
  });

  describe('parseCookies', () => {
    it('should extract SAPISID and HSID from cookie string', () => {
      const cookieString = 'SAPISID=test-sapisid; HSID=test-hsid; SSID=test-ssid; OTHER=something';
      const cookies = parseCookies(cookieString, ['SAPISID', 'HSID']);
      expect(cookies).toEqual({
        SAPISID: 'test-sapisid',
        HSID: 'test-hsid',
      });
    });

    it('should return empty values for missing keys', () => {
      const cookieString = 'SSID=test-ssid';
      const cookies = parseCookies(cookieString, ['SAPISID', 'HSID']);
      expect(cookies).toEqual({
        SAPISID: undefined,
        HSID: undefined,
      });
    });
  });
});
