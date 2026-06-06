import { routes } from './app.routes';

describe('partner app routes', () => {
  it('loads POS inventory routes under the runnable owner route prefix', async () => {
    const ownerRoute = routes.find((route) => route.path === 'owner');

    expect(ownerRoute?.loadChildren).toBeDefined();
    const children = await ownerRoute?.loadChildren?.();

    expect(Array.isArray(children)).toBe(true);
    expect(children).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'pos' }), expect.objectContaining({ path: 'inventory' })]),
    );
  });
});
