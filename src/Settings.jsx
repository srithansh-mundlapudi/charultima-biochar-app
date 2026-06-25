import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// API keys for weather and geocoding services
const WEATHER_API_KEY = '4d7f4c6942e64c2b9ef10628251002';
const GEOCODE_API_KEY = 'd0752e928fdd471c87946f5eb16b2246';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Settings = () => {
  // Auth0 hooks
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  // State
  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  // Load saved location from localStorage on component mount (backward compatibility)
  useEffect(() => {
    const savedLocation = localStorage.getItem('farmLocation');
    if (savedLocation) {
      setFormData((prev) => ({ ...prev, location: savedLocation }));
    }
  }, []);

  // Register user in PostgreSQL when they log in
  useEffect(() => {
    if (isAuthenticated && user) {
      registerUser();
      fetchFarms();
    }
  }, [isAuthenticated, user]);

  // Register user in PostgreSQL
  const registerUser = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth0Id: user.sub,
          email: user.email,
        }),
      });
      const data = await response.json();
      setDbUser(data);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  // Fetch all farms for the user
  const fetchFarms = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/farms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarmId(data[0].id);
        // Load weather for the first farm's location
        if (data[0].location_name) {
          setFormData((prev) => ({ ...prev, location: data[0].location_name }));
          fetchLocationData(data[0].location_name, data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  // Save farm to PostgreSQL
  const saveFarmToDatabase = async (farmName, locationName, latitude, longitude) => {
    if (!dbUser?.id) return null;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farmName,
          locationName,
          latitude,
          longitude,
        }),
      });
      const newFarm = await response.json();
      setFarms((prev) => [newFarm, ...prev]);
      setSelectedFarmId(newFarm.id);
      return newFarm;
    } catch (error) {
      console.error('Error saving farm:', error);
      return null;
    }
  };

  // Fetch coordinates for the given location using Geocoding API
  const getCoordinates = async (location) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${GEOCODE_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const coordinates = data.results[0].geometry;
        return {
          lat: coordinates.lat,
          lon: coordinates.lng,
          formatted: data.results[0].formatted,
        };
      }
      throw new Error('Location not found');
    } catch (error) {
      throw new Error('Error getting coordinates');
    }
  };

  // Fetch weather forecast for the given coordinates using Weather API
  const getWeatherForecast = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=7`
      );
      const data = await response.json();

      return data.forecast.forecastday.map((day) => ({
        date: day.date,
        rainfall: day.day.totalprecip_mm,
        temp_c: day.day.avgtemp_c,
        condition: day.day.condition.text,
      }));
    } catch (error) {
      throw new Error('Error fetching weather data');
    }
  };

  // Fetch and store location and weather data
  const fetchLocationData = async (location, existingFarmId = null) => {
    setLoading(true);
    try {
      const coordinates = await getCoordinates(location);
      if (!coordinates) {
        throw new Error('Failed to get coordinates');
      }

      localStorage.setItem('farmCoordinates', JSON.stringify(coordinates));

      const forecast = await getWeatherForecast(coordinates.lat, coordinates.lon);
      if (!forecast) {
        throw new Error('Failed to get weather forecast');
      }

      localStorage.setItem('weatherForecast', JSON.stringify(forecast));
      localStorage.setItem('lastWeatherUpdate', new Date().toISOString());

      setWeatherData(forecast);

      // Save to PostgreSQL if user is logged in and we have a farm name
      if (isAuthenticated && dbUser && formData.farmName) {
        if (existingFarmId) {
          // Update existing farm? (optional feature)
          setSelectedFarmId(existingFarmId);
        } else {
          // Create new farm
          await saveFarmToDatabase(formData.farmName, location, coordinates.lat, coordinates.lon);
        }
      }

      return { coordinates, forecast };
    } catch (error) {
      console.error('Error fetching location data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission to save location and fetch data
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      setStatus('Please enter a location');
      return;
    }
    if (!formData.farmName.trim()) {
      setStatus('Please enter a farm name');
      return;
    }

    setLoading(true);
    try {
      await fetchLocationData(formData.location);
      localStorage.setItem('farmLocation', formData.location);
      setStatus('Farm location and weather data saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle farm selection change
  const handleFarmChange = async (farmId) => {
    const farm = farms.find((f) => f.id === parseInt(farmId));
    if (farm) {
      setSelectedFarmId(farm.id);
      setFormData({
        farmName: farm.farm_name,
        location: farm.location_name,
      });
      await fetchLocationData(farm.location_name, farm.id);
    }
  };

  // Handle reset
  const handleReset = () => {
    localStorage.removeItem('farmLocation');
    localStorage.removeItem('farmCoordinates');
    localStorage.removeItem('weatherForecast');
    localStorage.removeItem('lastWeatherUpdate');
    setFormData({ farmName: '', location: '' });
    setWeatherData(null);
    setStatus('Location reset successfully!');
  };

  // If not logged in, show login screen
  if (!isAuthenticated) {
    return (
      <div className="settings-container p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-center">Farm Location Settings</h1>
            <h2 className="text-sm text-gray-500 mt-1 text-center">
              Log in to save your farm locations and analysis history
            </h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-600 mb-4">
              Create an account to save your farm locations and track your analysis history across
              devices.
            </p>
            <button
              onClick={() => loginWithRedirect()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Log In / Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container p-6">
      <div className="max-w-2xl mx-auto">
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Farm Location Settings</h1>
              <h2 className="text-sm text-gray-500 mt-1">
                Set your farm location for accurate biochar recommendations
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-red-600 text-sm hover:text-red-800"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Farm Selector (if multiple farms) */}
        {farms.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Farm
            </label>
            <select
              value={selectedFarmId || ''}
              onChange={(e) => handleFarmChange(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a farm...</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name} - {farm.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farm Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.farmName}
              onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., North Field, South Field, Family Farm"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farm Location
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="City, State (e.g., Cumming, Georgia)"
              required
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter your location to get weather-adjusted biochar recommendations
            </p>
          </div>

          {loading && (
            <div className="text-center text-gray-600">Fetching location and weather data...</div>
          )}

          {status && (
            <div
              className={`p-4 rounded-md ${
                status.includes('successfully')
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {status}
            </div>
          )}

          {weatherData && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Current Weather Data</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {weatherData.slice(0, 4).map((day) => (
                    <div key={day.date} className="text-sm text-gray-600">
                      <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                      : {day.condition}, {day.temp_c}°C, {day.rainfall}mm rain
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              disabled={loading}
            >
              Reset Location
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </form>

        {/* Saved Farms List */}
        {farms.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Your Farms</h3>
            <div className="space-y-2">
              {farms.map((farm) => (
                <div key={farm.id} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{farm.farm_name}</p>
                      <p className="text-sm text-gray-600">{farm.location_name}</p>
                      <p className="text-xs text-gray-500">
                        Lat: {farm.latitude}, Lon: {farm.longitude}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(farm.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900">About Location Settings</h3>
          <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
            <li>Location is used to fetch local weather data</li>
            <li>Weather conditions affect biochar application recommendations</li>
            <li>Weather data is automatically updated every 6 hours</li>
            <li>You can create multiple farms and track them separately</li>
            <li>Each farm has its own analysis history</li>
            <li>Use the reset button to clear your saved location and weather data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
