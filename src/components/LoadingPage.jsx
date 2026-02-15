// src/components/LoadingPage.jsx
import { Film, Sparkles, Heart } from 'lucide-react'
import './LoadingPage.css'

const LoadingPage = () => {
  return (
    <div className="loading-page">
      {/* Background dengan efek glassmorphism */}
      <div className="loading-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Container Utama */}
      <div className="loading-container">
        {/* Logo Section */}
        <div className="loading-brand">
          <div className="logo-wrapper">
            <Film size={80} className="logo-icon-main" />
            <div className="logo-glow"></div>
          </div>
          
          <div className="brand-text">
            <h1 className="brand-title">
              <span className="gradient-text">Lumin</span>
              <span className="gradient-text accent">Nhent4i</span>
            </h1>
            <p className="brand-subtitle">Your Ultimate Anime Destination</p>
          </div>
        </div>

        {/* Loading Indicator - Tanpa Spin */}
        <div className="loading-indicator">
          <div className="loading-bar-container">
            <div className="loading-bar"></div>
          </div>
          <p className="loading-status">Preparing your anime experience...</p>
        </div>

        {/* Feature Tags */}
        <div className="feature-tags">
          <div className="feature-tag">
            <Sparkles size={16} />
            <span>HD Streaming</span>
          </div>
          <div className="feature-tag">
            <Heart size={16} />
            <span>Indo Sub</span>
          </div>
          <div className="feature-tag">
            <Sparkles size={16} />
            <span>Daily Update</span>
          </div>
        </div>

        {/* Quotes */}
        <div className="loading-quote">
          <p className="quote-text">
            "The best anime moments are waiting for you"
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage
