import { describe, expect, it } from 'vitest';
import { clampNumber, escapeHtml } from './html-escape';

describe('HTML output security', () => {
  it('escapes markup and attribute-breaking characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('xss')">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;',
    );
  });

  it('clamps style values and rejects non-numeric input', () => {
    expect(clampNumber('150', 0, 100)).toBe(100);
    expect(clampNumber('0; color:red', 0, 100)).toBe(0);
  });
});
