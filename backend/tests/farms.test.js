const request = require('supertest');
const app = require('../server');

jest.mock('../db/pool', () => ({
  query: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  checkJwt: (req, res, next) => {
    req.auth = { payload: { sub: 'auth0|test-user-123' } };
    next();
  },
  getUserIdFromToken: (req) => 'auth0|test-user-123',
}));

const pool = require('../db/pool');

describe('Farms API', () => {
  beforeEach(() => {
    pool.query.mockClear();
  });

  const mockUser = {
    id: 1,
    auth0_id: 'auth0|test-user-123',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
  };

  const mockFarms = [
    {
      id: 1,
      user_id: 1,
      farm_name: 'Test Farm',
      location_name: 'Atlanta, GA',
      latitude: 33.749,
      longitude: -84.388,
      created_at: new Date().toISOString(),
    },
  ];

  test('GET /api/farms returns list of farms', async () => {
    // First query: getInternalUserId() - SELECT id FROM users
    // Second query: SELECT farms
    pool.query
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: mockFarms });

    const response = await request(app).get('/api/farms');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('farm_name', 'Test Farm');
  });

  test('POST /api/farms creates a new farm', async () => {
    const newFarm = {
      farmName: 'New Test Farm',
      locationName: 'Atlanta, GA',
      latitude: 33.749,
      longitude: -84.388,
    };

    const createdFarm = {
      id: 2,
      user_id: 1,
      farm_name: 'New Test Farm',
      location_name: 'Atlanta, GA',
      latitude: 33.749,
      longitude: -84.388,
      created_at: new Date().toISOString(),
    };

    // First query: getInternalUserId() - SELECT id FROM users
    // Second query: INSERT INTO farms
    pool.query
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: [createdFarm] });

    const response = await request(app)
      .post('/api/farms')
      .send(newFarm);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('farm_name', 'New Test Farm');
  });

  test('POST /api/farms returns 400 with missing fields', async () => {
    const response = await request(app)
      .post('/api/farms')
      .send({ farmName: 'Test Farm' });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/farms returns 400 with invalid coordinates', async () => {
    const response = await request(app)
      .post('/api/farms')
      .send({
        farmName: 'Test Farm',
        locationName: 'Atlanta, GA',
        latitude: 999,
        longitude: -84.388,
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/farms/:id returns farm', async () => {
    // First query: getInternalUserId() - SELECT id FROM users
    // Second query: SELECT farm
    pool.query
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: [mockFarms[0]] });

    const response = await request(app).get('/api/farms/1');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('farm_name', 'Test Farm');
  });

  test('GET /api/farms/:id returns 404 when farm not found', async () => {
    // First query: getInternalUserId() - SELECT id FROM users
    // Second query: SELECT farm (returns empty)
    pool.query
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/api/farms/999');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/farms/:id returns 404 when user not found', async () => {
    // First query: getInternalUserId() - SELECT id FROM users (returns empty)
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/api/farms/1');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
