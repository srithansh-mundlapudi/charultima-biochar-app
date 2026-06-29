const { getCache, setCache, deleteCache, getMetrics, resetMetrics } = require('../services/cacheService');

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    scanIterator: jest.fn(() => []),
    on: jest.fn(),
  })),
}));

describe('Cache Service', () => {
  beforeEach(() => {
    resetMetrics();
  });

  test('getCache returns null when Redis is not connected', async () => {
    const result = await getCache('test-key');
    expect(result).toBeNull();
  });

  test('setCache returns false when Redis is not connected', async () => {
    const result = await setCache('test-key', { data: 'test' });
    expect(result).toBe(false);
  });

  test('deleteCache returns false when Redis is not connected', async () => {
    const result = await deleteCache('test-key');
    expect(result).toBe(false);
  });

  test('getMetrics returns initial state', () => {
    const metrics = getMetrics();
    expect(metrics).toHaveProperty('hits', 0);
    expect(metrics).toHaveProperty('misses', 0);
    // ✅ Fix: hitRate is a number, not a string
    expect(metrics).toHaveProperty('hitRate', 0);
  });

  test('resetMetrics resets all counters', () => {
    resetMetrics();
    const metrics = getMetrics();
    expect(metrics.hits).toBe(0);
    expect(metrics.misses).toBe(0);
  });
});
