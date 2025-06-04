import { AIProviderService } from '../src/services/aiProviders';

const service = new AIProviderService() as any;

describe('cleanupLyricFormat', () => {
  test('removes repeated section headers', () => {
    const lyrics = `[Verse]\nLine1\n[Chorus]\nLine2\n[Verse]\nLine3`;
    const cleaned = service.cleanupLyricFormat(lyrics);
    expect(cleaned).toBe(`[Verse]\nLine1\n\n[Chorus]\nLine2\nLine3`);
  });

  test('preserves ad-lib lines in parentheses', () => {
    const lyrics = `[Verse]\n(Yeah)\nLine1`;
    const cleaned = service.cleanupLyricFormat(lyrics);
    expect(cleaned).toBe(`[Verse]\n(Yeah)\nLine1`);
  });

  test('collapses multiple blank lines', () => {
    const lyrics = `[Verse]\nLine1\n\n\nLine2`;
    const cleaned = service.cleanupLyricFormat(lyrics);
    expect(cleaned).toBe(`[Verse]\nLine1\n\nLine2`);
  });
});
