import { normalizeUrlRewrite, slugify, uniqueSlug } from './slug.util.js';

describe('slug utils', () => {
  it('slugifies titles', () => {
    expect(slugify('Bleeding & Menses Problems')).toBe('bleeding-and-menses-problems');
    expect(slugify('  VBAC: Myths, Facts!  ')).toBe('vbac-myths-facts');
  });

  it('appends a counter until the slug is free', async () => {
    const taken = new Set(['vbac', 'vbac-2']);
    await expect(uniqueSlug('VBAC', async (s) => taken.has(s))).resolves.toBe('vbac-3');
  });

  it('normalises url rewrites', () => {
    expect(normalizeUrlRewrite('/VBAC/Myths/')).toBe('vbac/myths');
    expect(normalizeUrlRewrite('  ')).toBeNull();
    expect(normalizeUrlRewrite(undefined)).toBeNull();
  });
});
