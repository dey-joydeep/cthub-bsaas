import { createPortfolioSchema, updatePortfolioSchema } from './portfolio.validator';

describe('Portfolio Validators', () => {
  describe('createPortfolioSchema', () => {
    it('should pass with valid data', () => {
      const data = {
        tenant_id: 'tenant1',
        user_id: 'user1',
        description: 'My portfolio',
      };
      const result = createPortfolioSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if tenant_id is missing', () => {
      const data = { user_id: 'user1', description: 'My portfolio' };
      const result = createPortfolioSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail if user_id is missing', () => {
      const data = { tenant_id: 'tenant1', description: 'My portfolio' };
      const result = createPortfolioSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail if description is missing', () => {
      const data = { tenant_id: 'tenant1', user_id: 'user1' };
      const result = createPortfolioSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updatePortfolioSchema', () => {
    it('should pass with a valid description', () => {
      const data = { description: 'New description' };
      const result = updatePortfolioSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass if description is not provided', () => {
      const data = {};
      const result = updatePortfolioSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if description is an empty string', () => {
      const data = { description: '' };
      const result = updatePortfolioSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
