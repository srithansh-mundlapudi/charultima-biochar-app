const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CharUltima API',
      version: '1.0.0',
      description: 'Agricultural analytics platform for biochar recommendations',
      contact: {
        name: 'CharUltima Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
      {
        url: 'https://charultima-api.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Farm: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            farm_name: { type: 'string' },
            location_name: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Analysis: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            farm_id: { type: 'integer' },
            nitrogen_level: { type: 'number' },
            nitrogen_status: { type: 'string', enum: ['deficient', 'moderate', 'healthy'] },
            biochar_amount: { type: 'number' },
            confidence: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateFarmRequest: {
          type: 'object',
          required: ['farmName', 'locationName', 'latitude', 'longitude'],
          properties: {
            farmName: { type: 'string' },
            locationName: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        CreateAnalysisRequest: {
          type: 'object',
          required: ['farmId', 'nitrogenLevel', 'nitrogenStatus'],
          properties: {
            farmId: { type: 'integer' },
            imageUrl: { type: 'string' },
            nitrogenLevel: { type: 'number' },
            nitrogenStatus: { type: 'string', enum: ['deficient', 'moderate', 'healthy'] },
            biocharAmount: { type: 'number' },
            confidence: { type: 'number' },
            cropType: { type: 'string' },
            soilType: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

module.exports = swaggerJsdoc(options);
