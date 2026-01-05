import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InfoSection from './components/InfoSection';
import Locator from './components/Locator';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <Hero />
        <InfoSection />
        <Locator />
      </div>
      <Footer />
    </div>
  );
}

export default App;
