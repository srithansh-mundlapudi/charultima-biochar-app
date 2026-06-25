import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import HamburgerMenu from './HamburgerMenu';
import Settings from './Settings';
import BiocharClassifier from './BiocharClassifier';
import FAQ from './FAQs';
import WhyBiochar from './WhyBiochar';
import ChatPage from './chatPage';
import './App.css';

function App() {
  const [state, setState] = useState({
    rows: '',
    cols: '',
    nitrogenData: {},
    isMenuOpen: false,
  });

  const handleSubmitFarmLayout = (e) => {
    e.preventDefault();
    const zones = {};
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        zones[`${String.fromCharCode(65 + r)}${c + 1}`] = '';
      }
    }
    setState((prev) => ({ ...prev, nitrogenData: zones }));
  };

  const handlers = {
    setRows: (rows) => setState((prev) => ({ ...prev, rows })),
    setCols: (cols) => setState((prev) => ({ ...prev, cols })),
    toggleMenu: () => setState((prev) => ({ ...prev, isMenuOpen: !prev.isMenuOpen })),
  };

  return (
    <Router>
      <div className="App">
        <HamburgerMenu isOpen={state.isMenuOpen} toggleMenu={handlers.toggleMenu} />
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard {...state} {...handlers} handleSubmitFarmLayout={handleSubmitFarmLayout} />
            }
          />
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/why-biochar" element={<WhyBiochar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/image-classifier" element={<BiocharClassifier />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
