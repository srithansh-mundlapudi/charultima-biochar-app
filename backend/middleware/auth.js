const { auth } = require('express-oauth2-jwt-bearer');
require('dotenv').config();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});

const getUserIdFromToken = (req) => req.auth.payload.sub;

module.exports = { checkJwt, getUserIdFromToken };