import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { LineChart, YAxis, CartesianGrid, Line, Legend, ResponsiveContainer } from 'recharts';


// Custom convolutional neural network (CNN) to detect nitrogen levels in plants
const NitrogenModel = () => {
 const model = tf.sequential();


 model.add(tf.layers.conv2d({
   inputShape: [224, 224, 3],
   filters: 32,
   kernelSize: 3,
   activation: 'relu',
   padding: 'same'
 }));
 model.add(tf.layers.maxPooling2d({ poolSize: 2 }));


 model.add(tf.layers.conv2d({
   filters: 64,
   kernelSize: 3,
   activation: 'relu',
   padding: 'same'
 }));
 model.add(tf.layers.maxPooling2d({ poolSize: 2 }));


 // Additional layers for nitrogen detection
 model.add(tf.layers.conv2d({
   filters: 128,
   kernelSize: 3,
   activation: 'relu',
   padding: 'same'
 }));
 model.add(tf.layers.maxPooling2d({ poolSize: 2 }));


 // Denser layers for classification
 model.add(tf.layers.flatten());
 model.add(tf.layers.dense({ units: 512, activation: 'relu' }));
 model.add(tf.layers.dropout({ rate: 0.5 }));
 model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
 model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
 return model;
};


// Segments the image into dark, medium, and light regions based on brightness
const colorSegmentation = async (canvas) => {
 const ctx = canvas.getContext('2d');
 const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
 const data = imageData.data;


 // Initialize counters for different color ranges
 const segments = {
   dark: 0,
   medium: 0,
   light: 0,
   total: data.length / 4
 };


 // Analyze pixels
 for (let i = 0; i < data.length; i += 4) {
   const r = data[i];
   const g = data[i + 1];
   const b = data[i + 2];


   // Calculate the grayscale value
   const gray = (r + g + b) / 3;


   // Categorize the pixels based on brightness
   if (gray < 85) {
     segments.dark++;
   } else if (gray < 170) {
     segments.medium++;
   } else {
     segments.light++;
   }
 }


 return segments;
};


const generateRecommendations = (nitrogenLevel) => {
 const recommendations = [];


 if (nitrogenLevel.value < 30) {
   recommendations.push(
     "Immediate application of biochar recommended",
     "Consider increasing biochar application rate by 25%",
     "Monitor soil moisture levels closely after application",
     "Implement companion planting to support nitrogen fixation"
   );
 } else if (nitrogenLevel.value < 60) {
   recommendations.push(
     "Schedule biochar application within next 2 weeks",
     "Standard application rate recommended",
     "Consider adding nitrogen-fixing cover crops",
     "Regular monitoring of soil conditions advised"
   );
 } else {
   recommendations.push(
     "Maintain current soil management practices",
     "Schedule routine biochar application for next season",
     "Continue monitoring nitrogen levels monthly"
   );
 }


 return recommendations;
};


// Calculates Confidence in Nitrogen Analysis (Used to only Determine the Confidence Levels in the ML prediction)
const calculateConfidence = (plantFeatures, nitrogenPrediction) => {
 let confidence = 0;


 // Factor 1: Plant feature detection confidence
 const plantConfidence = plantFeatures.reduce((acc, feature) =>
   acc + feature.probability, 0) / plantFeatures.length;


 // Factor 2: Nitrogen prediction confidence
 const nitrogenConfidence = Math.max(...Array.from(nitrogenPrediction));


 // Factor 3: Number of detected plant features
 const featureBonus = Math.min(plantFeatures.length * 0.1, 0.3);


 // Combine factors with weights
 confidence = (
   plantConfidence * 0.4 +
   nitrogenConfidence * 0.4 +
   featureBonus * 0.2
 ) * 100;


 return Math.min(Math.max(confidence, 0), 100);
};


const BiocharImageClassifier = () => {
 const [image, setImage] = useState(null);
 const [loading, setLoading] = useState(false);
 const [analysis, setAnalysis] = useState(null);
 const [models, setModels] = useState({
   mobilenet: null,
   cocossd: null,
   nitrogenModel: null
 });
  const fileInputRef = useRef(null);
 const [fileName, setFileName] = useState('No file selected.');




 // Initializes models
 useEffect(() => {
   const loadModels = async () => {
     try {
       setLoading(true);
       const [mobilenetModel, cocossdModel] = await Promise.all([
         mobilenet.load({ version: 2, alpha: 1.0 }),
         cocossd.load()
       ]);


       // Initializes custom nitrogen detection model
       const nitrogenModel = NitrogenModel();
       await nitrogenModel.compile({
         optimizer: tf.train.adam(0.0001),
         loss: 'categoricalCrossentropy',
         metrics: ['accuracy']
       });


       setModels({
         mobilenet: mobilenetModel,
         cocossd: cocossdModel,
         nitrogenModel
       });
     } catch (err) {
       console.error('Model loading error:', err);
     } finally {
       setLoading(false);
     }
   };


   loadModels();
 }, []);


 const handleImageSelection = (file) => {
   if (file) {
     const reader = new FileReader();
     reader.onload = (e) => {
       const img = new Image();
       img.src = e.target.result;
       setImage(e.target.result);
       setFileName("File: " + file.name);
     };
     reader.readAsDataURL(file);
   } else {
     setFileName("No file uploaded");
   }


   console.log(fileName);


 };


 const handleAnalyze = async () => {
   if (!image) {
     alert('Please select an image first');
     return;
   }


   const img = new Image();
   img.src = image;
   await img.decode();
   await analyzeImage(img);
 };


 const analyzeImage = async (imageElement) => {
   if (!models.mobilenet || !models.cocossd || !models.nitrogenModel) return;


   try {
     setLoading(true);


     // Creates the canvas for image processing
     const canvas = document.createElement('canvas');
     canvas.width = imageElement.width;
     canvas.height = imageElement.height;
     const ctx = canvas.getContext('2d');
     ctx.drawImage(imageElement, 0, 0);


     // Color-based segmentation
     const segmentation = await colorSegmentation(canvas);


     // Process image for nitrogen analysis
     const processedImage = tf.tidy(() => {
       return tf.browser.fromPixels(canvas)
         .resizeNearestNeighbor([224, 224])
         .toFloat()
         .expandDims();
     });


     // Run all models in parallel
     const [
       mobilenetResults,
       objectDetection,
       nitrogenPrediction
     ] = await Promise.all([
       models.mobilenet.classify(canvas),
       models.cocossd.detect(canvas),
       models.nitrogenModel.predict(processedImage).data()
     ]);


     // analysis
     const results = await computeAnalysis(
       mobilenetResults,
       objectDetection,
       nitrogenPrediction,
       segmentation
     );


     setAnalysis(results);
     processedImage.dispose();


   } catch (err) {
     console.error('Analysis error:', err);
   } finally {
     setLoading(false);
   }
 };


 const computeAnalysis = async (mobilenetResults, objectDetection, nitrogenPrediction, segmentation) => {
   const plantFeatures = mobilenetResults.filter(r =>
     r.className.toLowerCase().includes('plant') ||
     r.className.toLowerCase().includes('leaf')
   );


   // Calculate nitrogen levels
   const nitrogenLevel = calculateNitrogenLevel(nitrogenPrediction, segmentation);


   // Generate recommendations
   const recommendations = generateRecommendations(nitrogenLevel);


   return {
     nitrogenLevel,
     recommendations,
     confidence: calculateConfidence(plantFeatures, nitrogenPrediction),
     timeSeriesData: generateTimeSeriesData(nitrogenLevel),
     biocharRecommendations: calculateBiocharNeeds(nitrogenLevel)
   };
 };


 const calculateNitrogenLevel = (prediction, segmentation) => {
   // nitrogen level calculation using color analysis
   const [healthy, moderate, deficient] = prediction;


   // Calculate actual value based on color segmentation and ML prediction
   const darkRatio = segmentation.dark / segmentation.total;
   const mediumRatio = segmentation.medium / segmentation.total;
   const lightRatio = segmentation.light / segmentation.total;


   // Weight the calculations based on multiple factors
   const weightedValue = (
     (healthy * 100) +
     (moderate * 60) +
     (darkRatio * 40) +
     (mediumRatio * 70) +
     (lightRatio * 90)
   ) / (healthy + moderate + deficient + 2);


   return {
     value: Math.min(Math.max(weightedValue, 0), 100), // Ensures that it is between 0-100
     status: weightedValue > 70 ? 'healthy' :
       weightedValue > 40 ? 'moderate' : 'deficient',
     confidence: Math.max(healthy, moderate, deficient) * 100
   };
 };


 const generateTimeSeriesData = (nitrogenLevel) => {
   const weeks = 12;
   const data = [];
   const currentValue = nitrogenLevel.value;


   // Calculate the decline rate based on current nitrogen level
   const declineRate = currentValue * 0.05;


   // Calculate the improvement rate based on how much room for improvement exists
   const roomForImprovement = 100 - currentValue;
   const improvementRate = (roomForImprovement * 0.15) + 1; // 15% of possible improvement + base rate


   for (let i = 0; i < weeks; i++) {
     data.push({
       week: i,
       current: Math.max(0, currentValue - (declineRate * i)),
       withBiochar: Math.min(100, currentValue + (improvementRate * i))
     });
   }


   return data;
 };


 const calculateBiocharNeeds = (nitrogenLevel) => {
   const baseAmount = 5;
   const deficiencyFactor = (100 - nitrogenLevel.value) / 100;


   return {
     amount: baseAmount + (baseAmount * deficiencyFactor),
     frequency: nitrogenLevel.value < 30 ? 'immediate' :
       nitrogenLevel.value < 60 ? 'within 2 weeks' : 'within 1 month',
     application: nitrogenLevel.value < 50 ? 'heavy' : 'moderate'
   };
 };


 // Render functions for visualizations
 const renderNitrogenGauge = () => {
   if (!analysis) return null;


   const { value } = analysis.nitrogenLevel;


   // Create gradient stops based on ranges
   const gradientId = "nitrogenGradient";


     return (
       <div className="space-y-4">
         {/* Color gradient bar */}
         <div>
           <div style={{ width: "100%", height: "50%", margin: "0px", display: "block" }}>
             <div>
               <svg style={{ width: "100%", height: "50%", display: "block" }}>
                 <defs>
                   <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                     <stop offset="0%" stopColor="#F44336" />
                     <stop offset="50%" stopColor="#FFC107" />
                     <stop offset="100%" stopColor="#4CAF50" />
                   </linearGradient>
                 </defs>
                 <rect width="100%" height="50%" display="block" fill={`url(#${gradientId})`} />
               </svg>
               <div
                 className="absolute top-0 w-2 h-full bg-gray-900 shadow-lg transform transition-all duration-500 flex items-center justify-center"
                 style={{
                   transform: `translateX(${value}%)`,
                 }}
               >
                 <svg
                   xmlns="http://www.w3.org/2000/svg"
                   width="48"
                   height="48"
                   viewBox="0 0 24 24"
                   fill="white"
                 >
                   <path d="M12 2l6 8h-4v12h-4v-12h-4z" />
                 </svg>
               </div>
             </div>
             <br />
             <div className="absolute w-full h-full flex items-center justify-center">
               <table style={{
                 padding: 0
               }}>
                 <tbody>
                   <tr style={{
                     backgroundColor: "rgba(255, 255, 255, 0)"
                   }}>
                     <td>
                       <div style={{ display: "flex", padding: "0px" }}>
                         <p>Deficient</p>
                       </div>
                     </td>
                      <td>
                       <div style={{ display: "flex", justifyContent: "center", padding: "0px" }}>
                         <p>Moderate</p>
                       </div>
                     </td>
                      <td>
                       <div style={{ display: "flex", justifyContent: "right", padding: "0px" }}>
                         <p>Healthy</p>
                       </div>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       </div>
     );
   };


 const renderProjections = () => {
   if (!analysis) return null;


   return (
     <div className="mt-6">
       <h2 className="text-lg font-semibold mb-3">Projected Improvement with Biochar</h2>
       <ResponsiveContainer width="100%" height={300}>
         <LineChart data={analysis.timeSeriesData}>
           <CartesianGrid strokeDasharray="3 3" />
           <YAxis label={{ value: 'Nitrogen Level (%)', angle: -90 }}/>
           <br />
           <Legend />
           <Line type="monotone" dataKey="current" name="Without Biochar" stroke="#F44336" style={{paddingTop: "50px"}}/>
           <Line type="monotone" dataKey="withBiochar" name="With Biochar" stroke="#4CAF50" />
         </LineChart>
       </ResponsiveContainer>
     </div>
   );
 };
 const InstructionStep = ({ number, text, isActive }) => (
   <div className="flex items-start gap-3 mb-4">
     <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
       } font-semibold text-sm`}>
       {number}. {text}
     </div>
   </div>
 );


 const FarmerInstructions = ({ currentStep }) => (
   <div className="bg-white rounded-lg shadow-lg p-6">
     <h1 className="text-lg font-bold mb-4 text-gray-800 major" style={{
       display: "flex",
       justifyContent: "center",
     }}>Image Classifier</h1>
     <h2>How to Use This Tool</h2>
     <div className="space-y-2">
       <InstructionStep
         number={1}
         text="Take a clear photo of your crop leaves in good lighting."
         isActive={currentStep === 0}
       />
       <InstructionStep
         number={2}
         text="Upload the image as a file."
         isActive={currentStep === 1}
       />
       <InstructionStep
         number={3}
         text="Click 'Analyze' and wait for the results"
         isActive={currentStep === 2}
       />
       <InstructionStep
         number={4}
         text="Review nitrogen levels and biochar recommendations"
         isActive={currentStep === 3}
       />
       <InstructionStep
         number={5}
         text="Follow the suggested application timeline and amount"
         isActive={currentStep === 4}
       />
     </div>
   </div>
 );


 return (
   <div className="max-w-6xl mx-auto p-4">
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* Instructions Panel */}
       <div className="lg:col-span-1">
         <FarmerInstructions
           currentStep={!image ? 0 :
             image && !analysis ? 2 :
               analysis ? 3 : 1}
         />
       </div>


       <br />


       <div className="lg:col-span-2">
         <div className="mb-6">
           <div className="flex gap-4">
             <button
               onClick={() => fileInputRef.current.click()}
               className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-semibold"
             >
               Upload Image
             </button>
           </div>
           <br />
           <input
             style={{ opacity: 0, position: 'absolute' }}
             type="file"
             ref={fileInputRef}
             onChange={(e) => handleImageSelection(e.target.files[0])}
             accept="image/*"
             className="hidden"
           />


           <table>
             <tbody>
               <tr>
                 <td>
                   <h2 style={{
                     display: "flex",
                     justifyContent: "center",
                   }}>Image Analysis</h2>
                   <h3>{fileName}</h3>


                   {loading && (
                     <div className="text-center py-4">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                       <p className="mt-2 text-gray-600">Analyzing image...</p>
                     </div>
                   )}


                   {image && (
                     <div className="mt-4">
                       <img src={image} alt="Analysis" className="max-w-md mx-auto rounded-lg shadow-lg" />
                     </div>
                   )}
                   <br />
                   {image && (
                     <button
                       onClick={handleAnalyze}
                       className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 font-semibold"
                     >
                       Analyze
                     </button>
                   )}


                   {analysis && (
                     <div className="mt-6 space-y-6">
                       <div className="bg-white rounded-lg shadow-lg p-6">
                         <h2 className="text-xl font-bold mb-4">Analysis Results</h2>


                         {/* Nitrogen Level Gauge */}
                         <div className="mb-6">
                           <h4 className="text-lg font-semibold mb-2">Nitrogen Status</h4>
                           {renderNitrogenGauge()}
                         </div>


                         {/* Biochar Recommendations */}
                         <div className="mb-6">
                           <h2 className="text-lg font-semibold mb-2">Biochar Recommendations</h2>
                           <div className="bg-gray-50 rounded-lg p-4">
                             <table style={{
                               width: "500px"
                             }}>
                               <tbody>
                                 <tr>
                                   <td>
                                     <label>Required Amount</label>
                                   </td>
                                   <td>
                                     {analysis.biocharRecommendations.amount.toFixed(1)} tons/hectare
                                   </td>
                                 </tr>
                                 <tr>
                                   <td>
                                     <label>Application Timeline</label>
                                   </td>
                                   <td>
                                     {analysis.biocharRecommendations.frequency}
                                   </td>
                                 </tr>
                                 <tr>
                                   <td>
                                     <label>Application Intensity</label>
                                   </td>
                                   <td>
                                     {analysis.biocharRecommendations.application}
                                   </td>
                                 </tr>
                               </tbody>
                             </table>
                           </div>
                         </div>


                         {/* Projections Chart */}
                         {renderProjections()}


                         {/* Recommendations */}
                         {analysis.nitrogenLevel.value < 60 && (
                           <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                             <h2 className="text-lg font-semibold text-yellow-800 mb-2">Recommended Actions</h2>
                             <ul className="list-disc ml-6 space-y-2">
                               {analysis.recommendations.map((rec, index) => (
                                 <li key={index} className="text-yellow-800">{rec}</li>
                               ))}
                             </ul>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
       </div>
     </div>
   </div>
 );
};


export default BiocharImageClassifier;