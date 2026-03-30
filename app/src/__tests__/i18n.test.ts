import en from '../i18n/en';
import ja from '../i18n/ja';

describe('i18n translations', () => {
  const enKeys = Object.keys(en);
  const jaKeys = Object.keys(ja);

  it('should have the same keys in both languages', () => {
    const missingInJa = enKeys.filter((k) => !jaKeys.includes(k));
    const missingInEn = jaKeys.filter((k) => !enKeys.includes(k));

    if (missingInJa.length > 0) {
      console.warn('Keys missing in ja:', missingInJa);
    }
    if (missingInEn.length > 0) {
      console.warn('Keys missing in en:', missingInEn);
    }

    expect(missingInJa).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('should have matching types for all keys', () => {
    for (const key of enKeys) {
      const enVal = (en as any)[key];
      const jaVal = (ja as any)[key];
      expect(typeof enVal).toBe(typeof jaVal);
    }
  });

  it('should have non-empty string values', () => {
    for (const key of enKeys) {
      const val = (en as any)[key];
      if (typeof val === 'string') {
        expect(val.length).toBeGreaterThan(0);
      }
    }
    for (const key of jaKeys) {
      const val = (ja as any)[key];
      if (typeof val === 'string') {
        expect(val.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have matching function signatures', () => {
    for (const key of enKeys) {
      const enVal = (en as any)[key];
      const jaVal = (ja as any)[key];
      if (typeof enVal === 'function') {
        expect(typeof jaVal).toBe('function');
        // Check arity matches
        expect(enVal.length).toBe(jaVal.length);
      }
    }
  });
});
