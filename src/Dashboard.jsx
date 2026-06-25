import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getBiocharRecommendations, validateFarmData } from './BiocharCalculator';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Dashboard = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Farm selection state
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  // Form state
  const [rows, setRows] = useState('');
  const [cols, setCols] = useState('');
  const [cellLength, setCellLength] = useState('');
  const [cellWidth, setCellWidth] = useState('');
  const [soilType, setSoilType] = useState('');
  const [cropType, setCropType] = useState('');
  const [zones, setZones] = useState([]);
  const [nitrogenData, setNitrogenData] = useState({});
  const [biocharRecommendations, setBiocharRecommendations] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Fetch farms when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFarms();
    }
  }, [isAuthenticated]);

  const fetchFarms = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/farms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarmId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const handleNitrogenChange = (zone, value) => {
    setNitrogenData((prevData) => ({
      ...prevData,
      [zone]: parseFloat(value) || 0,
    }));
  };

  const handleSubmitFarmLayout = (e) => {
    e.preventDefault();
    if (step === 1) {
      const rowCount = parseInt(rows, 10);
      const colCount = parseInt(cols, 10);
      if (rowCount > 0 && colCount > 0) {
        const newZones = Array.from({ length: rowCount * colCount }, (_, i) => i + 1);
        setZones(newZones);
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const calculateBiochar = async () => {
    try {
      const farmData = {
        rows: parseInt(rows, 10),
        cols: parseInt(cols, 10),
        cellLength: parseFloat(cellLength),
        cellWidth: parseFloat(cellWidth),
        soilType,
        cropType,
        nitrogenLevels: nitrogenData,
      };
      validateFarmData(farmData);
      const recommendations = await getBiocharRecommendations(farmData);
      setBiocharRecommendations(recommendations.recommendations);

      // Save to backend if authenticated and farm selected
      if (isAuthenticated && selectedFarmId) {
        await saveCalculationToBackend(recommendations);
      }
    } catch (error) {
      console.error('Error calculating biochar:', error);
      setSaveStatus('Error saving calculation: ' + error.message);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const saveCalculationToBackend = async (recommendations) => {
    setSaving(true);
    try {
      const token = await getAccessTokenSilently();

      // Calculate average nitrogen level
      const nitrogenValues = Object.values(nitrogenData).filter((v) => v > 0);
      const avgNitrogen =
        nitrogenValues.length > 0
          ? nitrogenValues.reduce((a, b) => a + b, 0) / nitrogenValues.length
          : 50;

      // Calculate total biochar needed
      let totalBiochar = 0;
      if (recommendations.summary) {
        totalBiochar = parseFloat(recommendations.summary.totalBiocharNeeded) || 0;
      } else {
        totalBiochar = Object.values(recommendations)
          .filter((r) => r.details && r.details.totalAmount)
          .reduce((sum, r) => sum + parseFloat(r.details.totalAmount), 0);
      }

      const response = await fetch(`${API_URL}/analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farmId: selectedFarmId,
          nitrogenLevel: Math.round(avgNitrogen),
          nitrogenStatus:
            avgNitrogen < 40 ? 'deficient' : avgNitrogen < 70 ? 'moderate' : 'healthy',
          biocharAmount: totalBiochar,
          confidence: 85,
          analysisMethod: 'manual_grid_calculation',
          cropType,
          soilType,
        }),
      });

      if (response.ok) {
        setSaveStatus('Calculation saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      setSaveStatus('Failed to save calculation');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRows('');
    setCols('');
    setCellLength('');
    setCellWidth('');
    setSoilType('');
    setCropType('');
    setZones([]);
    setNitrogenData({});
    setBiocharRecommendations({});
    setStep(1);
  };

  const splitZones = [];
  for (let i = 0; i < parseInt(rows, 10); i++) {
    splitZones[i] = [];
    for (let j = 0; j < parseInt(cols, 10); j++) {
      const index = i * parseInt(cols, 10) + j;
      splitZones[i][j] = index < zones.length ? zones[index] : '';
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Farm Selector (if authenticated and multiple farms) */}
        {isAuthenticated && farms.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow-md p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Farm</label>
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name} - {farm.location_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Calculations will be saved to this farm</p>
          </div>
        )}

        {/* Save Status Indicator */}
        {saveStatus && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              saveStatus.includes('success')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {saveStatus}
          </div>
        )}

        {/* Saving Indicator */}
        {saving && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
            Saving calculation to farm...
          </div>
        )}

        <div className="space-y-6">
          {/* Farm Layout Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1
              className="text-xl font-semibold mb-4 major"
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.00005rem' }}
            >
              CharUltima
            </h1>
            <div className="collapsible">
              <div className={`content ${isOpen ? 'expanded' : 'collapsed'}`}>
                <h3 style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  CharUltima is a smart biochar management system that helps farmers optimize
                  nitrogen levels in soil by allowing them to input a custom farm grid with rows and
                  columns, the length and width of each zone, and the crop and soil types. Users
                  manually enter nitrogen levels for each zone, and the system calculates the
                  precise amount of biochar: this is implemented through a customized efficient
                  algorithm with the integration of the Weather and Geocode APIs to use the
                  location's weather data based on what the user inputs as his location and uses
                  that in the biochar calculations.
                </h3>
                <h3 style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  While generating biochar recommendations for each zone, the system also determines
                  the best application time based on the user's location. It also features image
                  classification powered by machine learning, enabling instant biochar
                  recommendations and a projected timeline comparing its use versus non-use.
                </h3>
                <h3 style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  Nitrogen runoffs are one of the biggest environmental threats currently in the
                  world, but with CharUltima, you're driving lasting change by promoting sustainable
                  farming and promoting our ecosystems.
                </h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="button primary" onClick={() => setIsOpen(!isOpen)}>
                  About Us
                </button>
              </div>
            </div>
            <h3 style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              Please Remember to First Input Location in SETTINGS Before Inputting Data!
            </h3>

            <form onSubmit={handleSubmitFarmLayout} className="space-y-4">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rows" className="block text-sm font-medium text-gray-700">
                      Number of Rows
                    </label>
                    <input
                      type="number"
                      id="rows"
                      value={rows}
                      onChange={(e) => setRows(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cols" className="block text-sm font-medium text-gray-700">
                      Number of Columns
                    </label>
                    <input
                      type="number"
                      id="cols"
                      value={cols}
                      onChange={(e) => setCols(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cellLength" className="block text-sm font-medium text-gray-700">
                      Cell Length (meters)
                    </label>
                    <input
                      type="number"
                      id="cellLength"
                      value={cellLength}
                      onChange={(e) => setCellLength(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cellWidth" className="block text-sm font-medium text-gray-700">
                      Cell Width (meters)
                    </label>
                    <input
                      type="number"
                      id="cellWidth"
                      value={cellWidth}
                      onChange={(e) => setCellWidth(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="soilType" className="block text-sm font-medium text-gray-700">
                      Soil Type
                    </label>
                    <select
                      id="soilType"
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Soil Type</option>
                      <option value="Sandy Soil">Sandy Soil</option>
                      <option value="Loamy Soil">Loamy Soil</option>
                      <option value="Clay Soil">Clay Soil</option>
                      <option value="Peat Soil">Peat Soil</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cropType" className="block text-sm font-medium text-gray-700">
                      Crop Type
                    </label>
                    <select
                      id="cropType"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Crop Type</option>
                      <option value="Corn">Corn</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Soybeans">Soybeans</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Potatoes">Potatoes</option>
                      <option value="Carrots">Carrots</option>
                      <option value="Lettuce">Lettuce</option>
                      <option value="Rice">Rice</option>
                      <option value="Fruit Trees">Fruit Trees</option>
                    </select>
                  </div>
                </div>
              )}
              {step <= 3 && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                </div>
              )}
            </form>

            {step > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700">
                  Reset Farm Layout
                </button>
              </div>
            )}
          </div>

          {step === 4 && zones.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zone Grid Display */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-center">Farm Zones</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <tbody>
                        {splitZones.map((zoneRow, rowIndex) => (
                          <tr key={rowIndex}>
                            {zoneRow.map((zone, colIndex) => (
                              <td key={colIndex} className="border p-2 text-center">
                                <div className="font-medium">{zone}</div>
                                <input
                                  type="number"
                                  value={nitrogenData[zone] || ''}
                                  onChange={(e) => handleNitrogenChange(zone, e.target.value)}
                                  className="w-20 p-1 text-sm border rounded"
                                  placeholder="N (ppm)"
                                  step="1"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Biochar Calculator */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-center">Biochar Calculator</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4">
                      <button
                        onClick={calculateBiochar}
                        disabled={saving}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {saving ? 'Saving...' : 'Calculate Biochar'}
                      </button>
                    </div>

                    {Object.keys(biocharRecommendations).length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h3 className="font-semibold text-lg">Recommendations</h3>
                        {Object.entries(biocharRecommendations).map(
                          ([zone, details]) =>
                            details.recommendation && (
                              <div key={zone} className="border-b pb-2">
                                <div className="font-medium">Zone {zone}</div>
                                <div className="text-sm text-gray-600">
                                  {details.recommendation}
                                </div>
                              </div>
                            )
                        )}
                        {biocharRecommendations.summary && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <div className="font-medium">Summary</div>
                            <div className="text-sm">
                              Total Biochar Needed:{' '}
                              {biocharRecommendations.summary.totalBiocharNeeded} tons
                            </div>
                            <div className="text-sm">
                              Recommended Date: {biocharRecommendations.recommendedDate}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
