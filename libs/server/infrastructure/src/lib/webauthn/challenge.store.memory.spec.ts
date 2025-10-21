import { InMemoryChallengeStore } from './challenge.store.memory';

describe('InMemoryChallengeStore', () => {
  let store: InMemoryChallengeStore;

  beforeEach(() => {
    jest.useFakeTimers();
    store = new InMemoryChallengeStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stores and consumes a challenge exactly once', async () => {
    await store.set('u1:reg', 'ch-123', 5);
    await expect(store.consume('u1:reg')).resolves.toBe('ch-123');
    await expect(store.consume('u1:reg')).resolves.toBeNull();
  });

  it('returns null when key is missing', async () => {
    await expect(store.consume('missing')).resolves.toBeNull();
  });

  it('expires after ttl seconds', async () => {
    await store.set('u2:auth', 'ch-abc', 1);
    // After expiry, the internal cleanup should delete the entry
    jest.advanceTimersByTime(1001);
    await expect(store.consume('u2:auth')).resolves.toBeNull();
  });

  it('does not expire immediately when ttl=0 (min 1s enforced)', async () => {
    await store.set('u3:auth', 'ch-zero', 0);
    // immediate consume should still work (min 1s TTL)
    await expect(store.consume('u3:auth')).resolves.toBe('ch-zero');
  });

  it('overwrite resets value and ttl', async () => {
    await store.set('u4:reg', 'old', 10);
    await store.set('u4:reg', 'new', 1);
    // Should read the new value before it expires
    jest.advanceTimersByTime(500);
    await expect(store.consume('u4:reg')).resolves.toBe('new');
  });
});
