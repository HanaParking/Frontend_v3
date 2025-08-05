import '../styles/HomeStyle.css'

import React from 'react';
import { useNavigate } from 'react-router-dom';


function Home() {
    const navigate = useNavigate();

    const goToMap = () => {
        navigate('/map');
    }

  return (
    <div className="home-container">
      <header className="home-header">
        {/* <div className="menu-icon">☰</div> */}
        <h1 className="header-title">실시간 주차현황</h1>
      </header>

      <div className="content-container">
        <h2 className="section-title">청라데이터센터</h2>

        <div className="status-card available"
             onClick={goToMap}>
          <div className="status-left">
            <div className="status-dot green" />
            <span>1층 옥내</span>
          </div>
          <div className="status-right green-text">15/30</div>
        </div>

         {/* <div className="status-card warning">
          <span>1층 옥외</span>
          <div className="status-right red-text">5/30</div>
        </div>

        <div className="status-card alert">
          <div className="status-left">
            <div className="alert-badge">혼잡</div>
            <span>1층 옥외</span>
          </div>
          <div className="status-right red-text">5/30</div>
        </div> */}
      </div>

      <footer className="footer">
        <p>made by <strong>슬기로운 주차생활</strong></p>
      </footer>
    </div>
  );
}

export default Home;
