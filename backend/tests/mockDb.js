// Mock data for testing
const mockAnalyses = [
  {
    id: 1,
    user_id: 1,
    farm_id: 1,
    image_url: 'https://example.com/image1.jpg',
    nitrogen_level: 65,
    nitrogen_status: 'moderate',
    biochar_amount: 4.5,
    confidence: 85,
    analysis_method: 'color_segmentation',
    crop_type: 'Corn',
    soil_type: 'Loamy Soil',
    created_at: new Date('2024-01-15'),
  },
  {
    id: 2,
    user_id: 1,
    farm_id: 1,
    image_url: 'https://example.com/image2.jpg',
    nitrogen_level: 30,
    nitrogen_status: 'deficient',
    biochar_amount: 8.2,
    confidence: 72,
    analysis_method: 'color_segmentation',
    crop_type: 'Wheat',
    soil_type: 'Sandy Soil',
    created_at: new Date('2024-01-20'),
  },
];

const mockFarms = [
  {
    id: 1,
    user_id: 1,
    farmName: 'Test Farm',
    locationName: 'Atlanta, GA',
    latitude: 33.7490,
    longitude: -84.3880,
    created_at: new Date().toISOString(),
  },
];

const mockUser = {
  id: 1,
  auth0_id: 'auth0|test-user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

module.exports = { mockAnalyses, mockFarms, mockUser };