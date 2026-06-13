import React, { useState } from 'react';


const FAQ = () => {
 // State to track which questions are expanded
 const [expandedItems, setExpandedItems] = useState({});


 // FAQ data
 const faqData = [
   {
     id: 1,
     question: "Why is CharUltima a Progressive Web Application?",
     answer: "CharUltima was designed as a Progressive Web Application to provide farmers with easy access to the platform, whether through a website or an app. This approach ensures that farmers can use the application anytime, anywhere, making it more convenient and versatile."
   },
   {
     id: 2,
     question: "What API is incorporated in CharUltima?",
     answer: "We have incorporated the Weather and Geocode APIs, which is used to help enhance the biochar application recommendations to make it more accurate based on location. This works for any location on planet Earth! Essentially, the farmer inputs his location and it uses that data to make more accurate biochar application recommendations, mainly to communicate to the farmer on when the farmer should apply it."
   },
   {
     id: 3,
     question: "What algorithm is incorporated in CharUltima for accuracy?",
     answer: "The algorithm uses several advanced formulas including the nitrogen mass balance equation and the biochar requirement formula (Biochar Needed = N deficit / (N retention efficiency  x Biochar Effectiveness Factor)). The Biochar Effective Factor is calculated by 1 + ((Biochar C:N Ratio - 30) / 100). The algorithm also integrates several other advanced aspects such as analyzing several other factors such as soil type, as well. The biochar result is converted into practical units."
   },
   {
     id: 4,
     question: "What are the environmental benefits of using biochar?",
     answer: "Biochar provides numerous environmental benefits, including reducing greenhouse gas emissions, enhancing soil fertility, increasing carbon sequestration, recycling organic waste, and conserving water through improved soil retention. However, a major challenge in agriculture is the lack of guidance on the appropriate amount to use. CharUltima addresses this gap by providing accurate and efficient recommendations, helping to tackle key environmental issues."
   },
   {
     id: 5,
     question: "How does the image classification feature work and why is it important?",
     answer: "Our classification system integrates feature extraction models such as MobileNet and COCO-SSD. This makes it optimized for speed and makes it very lightweight, which is really important to farmers, as they want quick, accurate outputs. It also uses Recharts for data visualization, as this is critical in producing visualizations to aid the farmer in making quick conclusions. There is also error handling involved, so the user is informed if an image fails to load. This image classification really works to be as accurate as it can be while being efficient at the same time, making it best for the farmer and therefore, best for our planet."
   },
   {
     id: 6,
     question: "Can this technology be implemented in different agricultural settings?",
     answer: "Yes, our system is designed to be versatile and adaptable to various agricultural contexts. It can be used in small-scale farming, large agricultural operations, research facilities, and educational institutions."
   },
   {
     id: 7,
     question: "What will the overall impact of CharUltima have on agriculture and how big would the impact be?",
     answer: "CharUltima is poised to revolutionize agriculture by addressing one of the world's most pressing environmental issues affecting millions of farms worldwide: nitrogen runoff. Approximately 20% to 60% of nitrogen applied to agricultural fields is lost to the environment, often through runoff, affecting water quality and ecosystem health. Also, the nitrogen runoff from agricultural fields is a major contributor to water pollution, leading to problems such as algal blooms and dead zones in aquatic ecosystems. By providing an algorithm that determines the optimal amount of biochar to use, CharUltima helps farmers enhance soil health and reduce nitrogen runoff. This not only improves crop yields but also contributes to environmental sustainability, making CharUltima a game-changer in modern agriculture worldwide."
   }
 ];


 // Toggle expansion of FAQ items
 const toggleItem = (id) => {
   setExpandedItems(prev => ({
     ...prev,
     [id]: !prev[id]
   }));
 };


 return (
   <div className="max-w-3xl mx-auto p-4 space-y-8"> {/* Increased space-y-8 to space out questions more */}
     <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Frequently Asked Questions</h1>
    
     {faqData.map((item) => (
       <div
         key={item.id}
         className="border border-gray-300 rounded-lg overflow-hidden shadow-sm"
       >
         <button
           onClick={() => toggleItem(item.id)}
           className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 transition-all duration-300"
         >
           <span className="font-medium text-left">{item.question}</span>
           <span className="text-3xl">{expandedItems[item.id] ? '↑' : '↓'}</span> {/* Larger arrows */}
         </button>
        
         {expandedItems[item.id] && (
           <div className="p-6 bg-gray-50 text-gray-700">
             {item.answer}
           </div>
         )}
       </div>
     ))}
   </div>
 );
};


export default FAQ;