import React, { useState } from 'react';
import { getBiocharRecommendations, validateFarmData } from './BiocharCalculator';


const Dashboard = () => {
 const [rows, setRows] = useState(0);
 const [cols, setCols] = useState(0);
 const [cellLength, setCellLength] = useState(0);
 const [cellWidth, setCellWidth] = useState(0);
 const [soilType, setSoilType] = useState('');
 const [cropType, setCropType] = useState('');
 const [zones, setZones] = useState([]);
 const [nitrogenData, setNitrogenData] = useState({});
 const [biocharRecommendations, setBiocharRecommendations] = useState({});
 const [isOpen, setIsOpen] = useState(false);
 const [step, setStep] = useState(1);


 const handleNitrogenChange = (zone, value) => {
   setNitrogenData((prevData) => ({
     ...prevData,
     [zone]: parseFloat(value),
   }));
 };


 const handleSubmitFarmLayout = (e) => {
   e.preventDefault();
   if (step === 1) {
     const newZones = Array.from({ length: rows * cols }, (_, i) => i + 1);
     setZones(newZones);
     setStep(2);
   } else if (step === 2) {
     setStep(3);
   } else if (step === 3) {
     setStep(4);
   }
 };


 const calculateBiochar = async () => {
   try {
     const farmData = {
       rows,
       cols,
       cellLength,
       cellWidth,
       soilType,
       cropType,
       nitrogenLevels: nitrogenData,
     };
     validateFarmData(farmData);
     const recommendations = await getBiocharRecommendations(farmData);
     setBiocharRecommendations(recommendations.recommendations);
   } catch (error) {
     console.error('Error calculating biochar:', error);
   }
 };


 const splitZones = [];
 for (let i = 0; i < rows; i++) {
   splitZones[i] = [];
   for (let j = 0; j < cols; j++) {
     const index = i * cols + j;
     splitZones[i][j] = index < zones.length ? zones[index] : '';
   }
 }


 return (
   <div className="min-h-screen bg-gray-100">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
       <div className="space-y-6">
         {/* Farm Layout Section */}
        
         <div className="bg-white rounded-lg shadow-md p-6">
           <h1 className="text-xl font-semibold mb-4 major" style={{ display: "flex", justifyContent: "center", marginBottom: "0.00005rem"}}>
             CharUltima
           </h1>
           <div className="collapsible">
             <div className={`content ${isOpen ? 'expanded' : 'collapsed'}`}>
               <h3 style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem"}}>
                 CharUltima is a smart biochar management system that helps farmers optimize nitrogen levels in soil by allowing them to input a custom farm grid with rows and columns, the length and width of each zone, and the crop and soil types. Users manually enter nitrogen levels for each zone, and the system calculates the precise amount of biochar: this is implemented through a customized efficient algorithm with the integration of the Weather and Geocode APIs to use the location's weather data based on what the user inputs as his location and uses that in the biochar calculations.
               </h3>
               <h3 style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem"}}>
               While generating biochar recommendations for each zone, the system also determines the best application time based on the user's location. It also features image classification powered by machine learning, enabling instant biochar recommendations and a projected timeline comparing its use versus non-use.
               </h3>
               <h3 style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem"}}>
               Nitrogen runoffs are one of the biggest environmental threats currently in the world, but with CharUltima, you're driving lasting change by promoting sustainable farming and promoting our ecosystems.
               </h3>
             </div>
             <div style={{ display: "flex", justifyContent: "center"}}>
               <button className="button primary" onClick={() => setIsOpen(!isOpen)}>About Us</button>
             </div>
           </div>
           <h3 style={{ display: "flex", justifyContent: "center", marginBottom: "1rem"}}>
             Please Remember to First Input Location in SETTINGS Before Inputting Data!
           </h3>


           <form onSubmit={handleSubmitFarmLayout} className="space-y-4">
             {step === 1 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <table style={{ display: "flex", justifyContent: "center" }}>
                   <tbody>
                     <tr>
                       <td>
                         <label htmlFor="rows" className="block text-sm font-medium text-gray-700">
                           Number of Rows
                         </label>
                       </td>
                       <td>
                         <input
                           type="number"
                           id="rows"
                           value={rows}
                           onChange={(e) => setRows(e.target.value)}
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           min="1"
                           required
                         />
                       </td>
                     </tr>
                     <tr>
                       <td>
                         <label htmlFor="cols" className="block text-sm font-medium text-gray-700">
                           Number of Columns
                         </label>
                       </td>
                       <td>
                         <input
                           type="number"
                           id="cols"
                           value={cols}
                           onChange={(e) => setCols(e.target.value)}
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           min="1"
                           required
                         />
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             )}
             {step === 2 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <table style={{ display: "flex", justifyContent: "center" }}>
                   <tbody>
                     <tr>
                       <td>
                         <label htmlFor="cellLength" className="block text-sm font-medium text-gray-700">
                           Cell Length (meters)
                         </label>
                       </td>
                       <td>
                         <input
                           type="number"
                           id="cellLength"
                           value={cellLength}
                           onChange={(e) => setCellLength(e.target.value)}
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           min="1"
                           required
                         />
                       </td>
                     </tr>
                     <tr>
                       <td>
                         <label htmlFor="cellWidth" className="block text-sm font-medium text-gray-700">
                           Cell Width (meters)
                         </label>
                       </td>
                       <td>
                         <input
                           type="number"
                           id="cellWidth"
                           value={cellWidth}
                           onChange={(e) => setCellWidth(e.target.value)}
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                           min="1"
                           required
                         />
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             )}
             {step === 3 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <table style={{ display: "flex", justifyContent: "center" }}>
                   <tbody>
                     <tr>
                       <td>
                         <label htmlFor="soilType" className="block text-sm font-medium text-gray-700">
                           Soil Type
                         </label>
                       </td>
                       <td>
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
                       </td>
                     </tr>
                     <tr>
                       <td>
                         <label htmlFor="cropType" className="block text-sm font-medium text-gray-700">
                           Crop Type
                         </label>
                       </td>
                       <td>
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
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             )}
             {step <= 3 && (
               <div style={{ display: "flex", justifyContent: "center" }}>
                 <button
                   type="submit"
                   className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   Next
                 </button>
               </div>
             )}
           </form>
         </div>


         {step === 4 && zones.length > 0 && (
           <div className="bg-white rounded-lg shadow-md p-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <br />


               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 <table style={{ display: "flex", justifyContent: "center", borderCollapse: 'separate', borderSpacing: '20px 20px' }}>
                   <tbody>
                     {splitZones.map((zoneRow, rowIndex) => (
                       <tr className="space-y-2" key={rowIndex}>
                         {zoneRow.map((zone, colIndex) => (
                           <td key={colIndex} style={{ backgroundColor: "white", width: "20", height: "20", justifyContent: "center" }}>
                             <label className="grid">
                               {zone}
                             </label>
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>


               {/* Manual Calculator - Left Side */}
               <table style={{ tableLayout: 'fixed', width: '100%' }}>
                 <tbody>
                   <tr style={{ backgroundColor: "1b1d1e" }}>
                     <td style={{ verticalAlign: "top", backgroundColor: "1b1d1e" }}>
                       <div className="bg-gray-50 rounded-lg p-6">
                         <h2 className="text-xl font-semibold mb-4" style={{ display: "flex", justifyContent: "center"}}>
                           Manual Biochar Calculator
                         </h2>


                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                           <table style={{ display: "flex", justifyContent: "center" }}>
                             <tbody>
                               {zones.map((zone) => (
                                 <tr key={zone} className="space-y-2">
                                   <td>
                                     <label htmlFor={`nitrogen-${zone}`} className="block text-sm font-medium text-gray-700">
                                       Zone {zone}
                                     </label>
                                   </td>
                                   <td>
                                     <input
                                       type="number"
                                       id={`nitrogen-${zone}`}
                                       value={nitrogenData[zone] || ""}
                                       onChange={(e) => handleNitrogenChange(zone, e.target.value)}
                                       className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                       placeholder="Parts Per Million|PPM"
                                     />
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                         <div style={{ display: "flex", justifyContent: "center"}}>
                           <button
                             onClick={calculateBiochar}
                             className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                           >
                             Calculate Biochar
                           </button>
                         </div>
                       </div>
                     </td>
                     <td style={{ verticalAlign: "top" }}>
                       {/* Manual Calculator Results */}
                       {Object.keys(biocharRecommendations).length > 0 && (
                         <div className="mt-6">
                           <h3 className="text-lg font-medium text-gray-900 mb-3" style={{ display: "flex", justifyContent: "center"}}>
                             Manual Calculations
                           </h3>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                             <table style={{ display: "flex", justifyContent: "center" }}>
                               <tbody>
                                 {Object.entries(biocharRecommendations).map(([zone, details]) => (
                                   details.recommendation && (
                                     <tr key={zone} className="bg-white rounded-md p-3">
                                       <td>
                                         <p className="text-sm font-medium text-gray-700">
                                           Zone {zone}
                                         </p>
                                       </td>
                                       <td>
                                         <p className="text-sm text-gray-600">
                                           {details.recommendation}
                                         </p>
                                       </td>
                                     </tr>
                                   )
                                 ))}
                                 {biocharRecommendations.recommendedDate && (
                                   <tr className="bg-white rounded-md p-3">
                                     <td>
                                       <p className="text-sm font-medium text-gray-700">
                                         Recommended Date
                                       </p>
                                     </td>
                                     <td>
                                       <p className="text-sm text-gray-600">
                                         {biocharRecommendations.recommendedDate}
                                       </p>
                                     </td>
                                   </tr>
                                 )}
                                 {biocharRecommendations.applicationConditions && (
                                   <tr className="bg-white rounded-md p-3">
                                     <td>
                                       <p className="text-sm font-medium text-gray-700">
                                         Application Conditions
                                       </p>
                                     </td>
                                     <td>
                                       <p className="text-sm text-gray-600">
                                         {biocharRecommendations.applicationConditions}
                                       </p>
                                     </td>
                                   </tr>
                                 )}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
         )}
       </div>
     </div>
   </div>
 );
};


export default Dashboard;