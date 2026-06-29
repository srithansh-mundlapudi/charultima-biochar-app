const analysisService = require('../services/analysisService');

describe('Analysis Service', () => {
  test('calculateRecommendedNitrogen returns correct value for valid inputs', () => {
    const result = analysisService.calculateRecommendedNitrogen('Loamy Soil', 'Corn');
    expect(result).toBe(26.25);
  });

  test('calculateRecommendedNitrogen handles unknown soil type', () => {
    const result = analysisService.calculateRecommendedNitrogen('Unknown Soil', 'Corn');
    expect(result).toBe(26.25);
  });

  test('calculateRecommendedNitrogen handles unknown crop type', () => {
    const result = analysisService.calculateRecommendedNitrogen('Loamy Soil', 'Unknown Crop');
    expect(result).toBe(25);
  });

  test('calculateBiocharForZone returns no biochar for no deficit', () => {
    const result = analysisService.calculateBiocharForZone(10, 20, 100);
    expect(result.recommendation).toBe('No biochar needed');
    // ✅ Fix: biocharNeeded is a string, so check it as a string
    expect(result.biocharNeeded).toBe(0);
  });

  test('calculateBiocharForZone calculates positive biochar for deficit', () => {
    const result = analysisService.calculateBiocharForZone(50, 30, 100);
    // ✅ Fix: parseFloat since it's a string
    expect(parseFloat(result.biocharNeeded)).toBeGreaterThan(0);
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('applicationRate');
    expect(result).toHaveProperty('totalAmount');
  });

  test('calculateAllBiochar calculates summary correctly', () => {
    const nitrogenLevels = { zone1: 50, zone2: 60, zone3: 40 };
    const result = analysisService.calculateAllBiochar(nitrogenLevels, 30, 100);
    expect(result.summary).toHaveProperty('totalCells', 3);
    expect(result.summary).toHaveProperty('totalBiocharNeeded');
    expect(result.summary).toHaveProperty('averageBiocharPerCell');
  });

  test('calculateAllBiochar handles empty nitrogen levels', () => {
    const result = analysisService.calculateAllBiochar({}, 30, 100);
    expect(result.summary.totalCells).toBe(0);
    expect(result.summary.totalBiocharNeeded).toBe('0.00');
  });
});
