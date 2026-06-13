import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HamburgerMenu.css';


const HamburgerMenu = ({ isOpen, toggleMenu }) => {
 const navigate = useNavigate();


 const handleNavigation = (path) => {
   navigate(path);
   toggleMenu();
 };


 return (
   <>
     {/* Hamburger Button */}
     <div className={`hamburger-button ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
       <span></span>
       <span></span>
       <span></span>
     </div>


     {/* Sliding Menu */}
     <div className={`slide-menu ${isOpen ? 'open' : ''}`}>
       <nav>
         <div className="menu-items">
           <button onClick={() => handleNavigation('/')} className="menu-item">
             <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                 d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
             </svg>
             Dashboard
           </button>
           <button onClick={() => handleNavigation('/image-classifier')} className="menu-item">
             <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                 d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
             </svg>
             Image Classifier
           </button>
           <button onClick={() => handleNavigation('/settings')} className="menu-item">
             <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                 d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
             </svg>
             Settings
           </button>
           <button onClick={() => handleNavigation('/faqs')} className="menu-item">
             <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                 d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>
             FAQs
           </button>
           <button onClick={() => handleNavigation('/chat')} className="menu-item">
         <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
     d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
       />
   </svg>
   Any Questions?
     </button>
           <button onClick={() => handleNavigation('/why-biochar')} className="menu-item">
             <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                 d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>
             Why Biochar?
           </button>
         </div>
       </nav>
     </div>


     {/* Overlay */}
     {isOpen && (
       <div className="menu-overlay" onClick={toggleMenu}></div>
     )}
   </>
 );
};


export default HamburgerMenu;