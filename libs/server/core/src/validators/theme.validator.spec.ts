import { updateThemeSchema } from './theme.validator';

describe('Theme Validator', () => {
  it('should pass with valid hex color codes', () => {
    const data = {
      primary_color: '#FFFFFF',
      secondary_color: '#000000',
      accent_color: '#FF00FF',
    };
    const result = updateThemeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should fail with an invalid primary_color', () => {
    const data = {
      primary_color: '#GGG',
      secondary_color: '#000000',
      accent_color: '#FF00FF',
    };
    const result = updateThemeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if a color is missing', () => {
    const data = {
      primary_color: '#FFFFFF',
      secondary_color: '#000000',
    };
    const result = updateThemeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
