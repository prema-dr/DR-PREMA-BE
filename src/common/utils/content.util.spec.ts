import { makeExcerpt, readTimeMinutes, sanitizeBlogHtml } from './content.util.js';

describe('content utils', () => {
  it('strips scripts and event handlers but keeps formatting', () => {
    const out = sanitizeBlogHtml('<p onclick="x()">Hi <strong>there</strong></p><script>alert(1)</script>');
    expect(out).toBe('<p>Hi <strong>there</strong></p>');
  });

  it('rejects javascript: links', () => {
    expect(sanitizeBlogHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('adds rel to links', () => {
    expect(sanitizeBlogHtml('<a href="https://a.com">x</a>')).toContain('rel="noopener noreferrer"');
  });

  it('builds excerpts with spacing between blocks', () => {
    expect(makeExcerpt('<h2>Hi</h2><p>There</p>')).toBe('Hi There');
    expect(makeExcerpt(`<p>${'word '.repeat(100)}</p>`, 50)).toHaveLength(50);
  });

  it('estimates read time at 200 wpm, minimum 1', () => {
    expect(readTimeMinutes('<p>short</p>')).toBe(1);
    expect(readTimeMinutes(`<p>${'word '.repeat(450)}</p>`)).toBe(3);
  });
});
