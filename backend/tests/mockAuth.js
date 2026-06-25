// Mock Auth0 middleware for testing
const mockCheckJwt = (req, res, next) => {
  req.auth = { payload: { sub: 'auth0|test-user-123' } };
  next();
};

const mockGetUserIdFromToken = (req) => 'auth0|test-user-123';

module.exports = { mockCheckJwt, mockGetUserIdFromToken };