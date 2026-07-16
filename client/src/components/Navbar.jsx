import React from 'react'

function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="navbar hero-card">
      <div className="navbar-brand">
        <span className="navbar-logo">🗼</span>
        <div className="brand-text">
          <span className="eyebrow">Tokyo Crawler</span>
          <span className="brand-title">Event Hub</span>
        </div>
      </div>
      <div className="navbar-links">
        <button
          className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📋 Sự kiện đã lưu
        </button>
        <button
          className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Cấu hình cào
        </button>
      </div>
    </nav>
  )
}

export default Navbar
