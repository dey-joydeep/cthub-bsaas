// moved from __tests__/theme/theme.edgecase.test.ts
import { ThemeService } from '../../theme.service';

describe('ThemeService Edge Cases', () => {
  const service = new ThemeService();

  it('should throw error for invalid color codes', async () => {
    await expect(
      service.updateTheme('tenant1', {
        primaryColor: 'blue',
        secondaryColor: '#fff',
        accentColor: '#gggggg',
      }),
    ).rejects.toThrow();
  });

  it('should throw error for missing colors', async () => {
    await expect(service.updateTheme('tenant1', { primaryColor: '', secondaryColor: '', accentColor: '' })).rejects.toThrow();
  });
});
