import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// API keys for weather and geocoding services
const WEATHER_API_KEY = "4d7f4c6942e64c2b9ef10628251002";
const GEOCODE_API_KEY = "d0752e928fdd471c87946f5eb16b2246";
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Settings = () => {
  // Auth0 hooks
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  
  // State to hold the form data, status messages, and weather data
  const [formData, setFormData] = useState({ location: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);

  // Load saved location from localStorage on component mount (for backward compatibility)
  useEffect(() => {
    const savedLocation = localStorage.getItem('farmLocation');
    if (savedLocation) {
      setFormData({ location: savedLocation });
    }
  }, []);

  // Register user in PostgreSQL when they log in
  useEffect(() => {
    if (isAuthenticated && user) {
      registerUser();
      fetchSavedLocations();
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
          email: user.email
        })
      });
      const data = await response.json();
      setDbUser(data);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  // Fetch saved locations from PostgreSQL
  const fetchSavedLocations = async () => {
    if (!dbUser?.id) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/farm-locations/${dbUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSavedLocations(data);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    }
  };

  // Save location to PostgreSQL
  const saveLocationToDatabase = async (locationName, latitude, longitude) => {
    if (!dbUser?.id) return;
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${API_URL}/farm-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: dbUser.id,
          locationName,
          latitude,
          longitude
        })
      });
      fetchSavedLocations(); // Refresh the list
    } catch (error) {
      console.error('Error saving location:', error);
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
          formatted: data.results[0].formatted
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
        `http://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=7`
      );
      const data = await response.json();
      
      return data.forecast.forecastday.map(day => ({
        date: day.date,
        rainfall: day.day.totalprecip_mm,
        temp_c: day.day.avgtemp_c,
        condition: day.day.condition.text
      }));
    } catch (error) {
      throw new Error('Error fetching weather data');
    }
  };

  // Fetch and store location and weather data
  const fetchLocationData = async (location) => {
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
      
      // Save to PostgreSQL if user is logged in
      if (isAuthenticated && dbUser) {
        await saveLocationToDatabase(location, coordinates.lat, coordinates.lon);
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

    setLoading(true);
    try {
      await fetchLocationData(formData.location);
      localStorage.setItem('farmLocation', formData.location);
      setStatus('Location and weather data saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle reset of the location and weather data
  const handleReset = () => {
    localStorage.removeItem('farmLocation');
    localStorage.removeItem('farmCoordinates');
    localStorage.removeItem('weatherForecast');
    localStorage.removeItem('lastWeatherUpdate');
    setFormData({ location: '' });
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
            <p className="text-gray-600 mb-4">Create an account to save your farm locations and track your analysis history across devices.</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="text-center text-gray-600">
              Fetching location and weather data...
            </div>
          )}

          {status && (
            <div className={`p-4 rounded-md ${
              status.includes('successfully')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
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
                      <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>:
                      {' '}{day.condition}, {day.temp_c}°C, {day.rainfall}mm rain
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

        {/* Saved Locations History */}
        {savedLocations.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Your Saved Locations</h3>
            <div className="space-y-2">
              {savedLocations.map((loc) => (
                <div key={loc.id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{loc.location_name}</p>
                    <p className="text-sm text-gray-500">
                      Lat: {loc.latitude}, Lon: {loc.longitude}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Saved: {new Date(loc.saved_at).toLocaleDateString()}
                  </p>
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
            <li>You can update your location at any time</li>
            <li>Use the reset button to clear your saved location and weather data</li>
            <li>Your locations are saved to your account and sync across devices</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;