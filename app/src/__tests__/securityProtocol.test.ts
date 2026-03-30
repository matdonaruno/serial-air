/**
 * Tests for the security protocol message parsing.
 * Verifies that fingerprint, pairing, and auth messages
 * are correctly identified and parsed.
 */

// Protocol message format from Arduino:
// \x01FP:{"id":"SA-...","heap":168000,"version":"1.2.0"}
// \x01PAIR:4821
// \x01AUTH:REQUIRED

const PROTOCOL_PREFIX = '\x01';

interface FingerprintMessage {
  type: 'fingerprint';
  id: string;
  heap: number;
  version: string;
}

interface PairingMessage {
  type: 'pairing';
  code: string;
}

interface AuthMessage {
  type: 'auth_required';
}

type ProtocolMessage = FingerprintMessage | PairingMessage | AuthMessage | null;

function parseProtocolMessage(line: string): ProtocolMessage {
  if (!line.startsWith(PROTOCOL_PREFIX)) return null;

  const content = line.slice(1); // Remove prefix

  if (content.startsWith('FP:')) {
    try {
      const json = JSON.parse(content.slice(3));
      return {
        type: 'fingerprint',
        id: json.id ?? '',
        heap: json.heap ?? 0,
        version: json.version ?? '',
      };
    } catch {
      return null;
    }
  }

  if (content.startsWith('PAIR:')) {
    return {
      type: 'pairing',
      code: content.slice(5).trim(),
    };
  }

  if (content.startsWith('AUTH:REQUIRED')) {
    return { type: 'auth_required' };
  }

  return null;
}

describe('Security Protocol Parser', () => {
  describe('Fingerprint messages', () => {
    it('should parse valid fingerprint', () => {
      const msg = parseProtocolMessage('\x01FP:{"id":"SA-AABBCCDDEEFF","heap":168000,"version":"1.2.0"}');
      expect(msg).toEqual({
        type: 'fingerprint',
        id: 'SA-AABBCCDDEEFF',
        heap: 168000,
        version: '1.2.0',
      });
    });

    it('should handle missing fields gracefully', () => {
      const msg = parseProtocolMessage('\x01FP:{"id":"SA-123"}');
      expect(msg).toEqual({
        type: 'fingerprint',
        id: 'SA-123',
        heap: 0,
        version: '',
      });
    });

    it('should return null for invalid JSON', () => {
      const msg = parseProtocolMessage('\x01FP:{invalid}');
      expect(msg).toBeNull();
    });
  });

  describe('Pairing messages', () => {
    it('should parse pairing code', () => {
      const msg = parseProtocolMessage('\x01PAIR:4821');
      expect(msg).toEqual({
        type: 'pairing',
        code: '4821',
      });
    });

    it('should trim whitespace', () => {
      const msg = parseProtocolMessage('\x01PAIR:1234  ');
      expect(msg).toEqual({
        type: 'pairing',
        code: '1234',
      });
    });
  });

  describe('Auth messages', () => {
    it('should parse auth required', () => {
      const msg = parseProtocolMessage('\x01AUTH:REQUIRED');
      expect(msg).toEqual({ type: 'auth_required' });
    });
  });

  describe('Non-protocol messages', () => {
    it('should return null for regular serial data', () => {
      expect(parseProtocolMessage('temp:25.5 hum:60.0')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseProtocolMessage('')).toBeNull();
    });

    it('should return null for unknown protocol message', () => {
      expect(parseProtocolMessage('\x01UNKNOWN:data')).toBeNull();
    });
  });
});
