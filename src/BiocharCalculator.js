const SOIL_DATA = {
 "Sandy Soil": 20,
 "Loamy Soil": 25,
 "Clay Soil": 35,
 "Peat Soil": 40
};


const CROP_DATA = {
 "Corn": 27.5,
 "Wheat": 22.5,
 "Soybeans": 12.5,
 "Tomatoes": 40,
 "Potatoes": 32.5,
 "Carrots": 25,
 "Lettuce": 27.5,
 "Rice": 25,
 "Fruit Trees": 15
};


// Configuration
const WEATHER_API_KEY = "4d7f4c6942e64c2b9ef10628251002";


export const getBiocharRecommendations = async (farmData) => {
 const { 
   cellLength,
   cellWidth,
   soilType,
   cropType,
   nitrogenLevels
 } = farmData;
  // Get location data from localStorage (set by Settings component)
 const location = localStorage.getItem('farmLocation');
 const coordinates = JSON.parse(localStorage.getItem('farmCoordinates'));
 const lastWeatherUpdate = localStorage.getItem('lastWeatherUpdate');
  if (!location || !coordinates) {
   throw new Error("Please set your farm location in Settings first");
 }


 // Check if necessary to update weather data (more than 6 hours old)
 let forecast;
 if (!lastWeatherUpdate || new Date() - new Date(lastWeatherUpdate) > 6 * 60 * 60 * 1000) {
   forecast = await getWeatherForecast(coordinates.lat, coordinates.lon);
   localStorage.setItem('lastWeatherUpdate', new Date().toISOString());
   localStorage.setItem('weatherForecast', JSON.stringify(forecast));
 } else {
   forecast = JSON.parse(localStorage.getItem('weatherForecast'));
 }


 if (!forecast) {
   throw new Error("Failed to get weather forecast");
 }


 // Calculate cell area
 const cellArea = cellLength * cellWidth; // Area in square meters


 // Calculate recommended nitrogen
 const soilNitrogen = SOIL_DATA[soilType];
 const cropNitrogen = CROP_DATA[cropType];
 const recommendedNitrogen = (soilNitrogen + cropNitrogen) / 2;


 // Calculate biochar recommendations
 const recommendations = calculateBiochar(
   nitrogenLevels,
   recommendedNitrogen,
   forecast,
   cellArea
 );


 return {
   recommendations,
   location,
   forecast,
   recommendedNitrogen,
   cellArea
 };
};


const calculateBiochar = (nitrogenData, recommendedNitrogen, forecast, cellArea) => {
 const NITROGEN_RETENTION_RATE = 0.4;
 const BIOCHAR_EFFECTIVENESS = 1.1;
 const BIOCHAR_DENSITY = 10; // tons/acre (Wood Biochar)
  const recommendations = {};
  // Calculate recommendations for each cell
 Object.entries(nitrogenData).forEach(([cell, level]) => {
   const nitrogenDeficit = level - recommendedNitrogen;
  
   if (nitrogenDeficit <= 0) {
     recommendations[cell] = {
       recommendation: "No biochar needed (low nitrogen levels)",
       details: {
         nitrogenLevel: level,
         deficit: nitrogenDeficit,
         biocharNeeded: 0
       }
     };
   } else {
     const biocharNeeded = nitrogenDeficit / (NITROGEN_RETENTION_RATE * BIOCHAR_EFFECTIVENESS);
     const applicationRate = (biocharNeeded / BIOCHAR_DENSITY).toFixed(2);
    
     // Convert to area-specific recommendation
     const cellAreaAcres = cellArea / 4046.86; // Convert m² to acres
     const totalBiochar = (applicationRate * cellAreaAcres).toFixed(2);
    
     recommendations[cell] = {
       recommendation: `${applicationRate} tons/acre (${totalBiochar} tons total)`,
       details: {
         nitrogenLevel: level,
         deficit: nitrogenDeficit.toFixed(2),
         biocharNeeded: biocharNeeded.toFixed(2),
         applicationRate: applicationRate,
         cellArea: cellAreaAcres.toFixed(2),
         totalAmount: totalBiochar
       }
     };
   }
 });


 // Determine best application date
 const rainFreeDay = forecast.find(day => day.rainfall === 0);
 if (rainFreeDay) {
   recommendations.recommendedDate = rainFreeDay.date;
   recommendations.applicationConditions = "Optimal - No rainfall expected";
 } else {
   // Find day with minimal rainfall
   const minRainfall = Math.min(...forecast.map(day => day.rainfall));
   const bestDay = forecast.find(day => day.rainfall === minRainfall);
   recommendations.recommendedDate = bestDay.date;
   recommendations.applicationConditions = `Suboptimal - Minimum rainfall (${minRainfall}mm) on this date`;
 }


 // summary statistics
 const cells = Object.keys(nitrogenData).length;
 const totalBiochar = Object.values(recommendations)
   .filter(r => r.details)
   .reduce((sum, r) => sum + parseFloat(r.details.totalAmount), 0);


 recommendations.summary = {
   totalCells: cells,
   totalBiocharNeeded: totalBiochar.toFixed(2),
   averageBiocharPerCell: (totalBiochar / cells).toFixed(2),
   recommendedDate: recommendations.recommendedDate,
   applicationConditions: recommendations.applicationConditions
 };


 return recommendations;
};


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
   console.error('Error getting weather forecast:', error);
   return null;
 }
};


// Helper function to validate farm data
export const validateFarmData = (data) => {
 const required = ['rows', 'cols', 'cellLength', 'cellWidth', 'soilType', 'cropType', 'nitrogenLevels'];
 const missing = required.filter(field => !data[field]);
  if (missing.length > 0) {
   throw new Error(`Missing required fields: ${missing.join(', ')}`);
 }


 if (!SOIL_DATA[data.soilType]) {
   throw new Error('Invalid soil type');
 }


 if (!CROP_DATA[data.cropType]) {
   throw new Error('Invalid crop type');
 }


 return true;
};
