const request = require('supertest');
const app = require('../server');

// ✅ Correct mock setup
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

describe('Analyses API', () => {
  beforeEach(() => {
    pool.query.mockClear();
  });

  const mockUser = {
    id: 1,
    auth0_id: 'auth0|test-user-123',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
  };

  // =======================
  // HEALTH CHECK (No Auth)
  // =======================
  test('GET /api/health returns 200', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  // =======================
  // CALCULATE BIOCHAR (Public)
  // =======================
  test('POST /api/analyses/calculate returns 200 with valid data', async () => {
    const response = await request(app)
      .post('/api/analyses/calculate')
      .send({
        nitrogenLevels: { zone1: 30, zone2: 50, zone3: 70 },
        soilType: 'Loamy Soil',
        cropType: 'Corn',
        cellLength: 100,
        cellWidth: 100,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('recommendations');
    expect(response.body).toHaveProperty('recommendedNitrogen');
  });

  test('POST /api/analyses/calculate returns 400 with missing fields', async () => {
    const response = await request(app)
      .post('/api/analyses/calculate')
      .send({ soilType: 'Loamy Soil' });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/analyses/calculate returns 400 with invalid cell dimensions', async () => {
    const response = await request(app)
      .post('/api/analyses/calculate')
      .send({
        nitrogenLevels: { zone1: 30 },
        soilType: 'Loamy Soil',
        cropType: 'Corn',
        cellLength: -10,
        cellWidth: 100,
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/analyses/calculate handles high nitrogen levels', async () => {
    const response = await request(app)
      .post('/api/analyses/calculate')
      .send({
        nitrogenLevels: { zone1: 100, zone2: 90 },
        soilType: 'Loamy Soil',
        cropType: 'Corn',
        cellLength: 100,
        cellWidth: 100,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('recommendations');
    expect(response.body.recommendations.zone1).toBeDefined();
  });

  test('POST /api/analyses/calculate handles invalid nitrogenLevels type', async () => {
    const response = await request(app)
      .post('/api/analyses/calculate')
      .send({
        nitrogenLevels: [30, 50, 70],
        soilType: 'Loamy Soil',
        cropType: 'Corn',
        cellLength: 100,
        cellWidth: 100,
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  afterAll(async () => {
    // Cleanup
  });
});