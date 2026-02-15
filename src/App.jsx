import { useState, useEffect } from 'react'

const API_BASE = 'https://www.sankavollerei.com/anime/neko'

// Proxy image helper
const proxyImage = (url) => {
  if (!url) return ''
  // For Vercel deployment
  return `/api/proxy?url=${encodeURIComponent(url)}`
  // For local development, use external proxy
  // return `https://corsproxy.io/?${encodeURIComponent(url)}`
}

// Get badge helper
const getBadge = (title) => {
  if (!title) return null
  if (title.includes('[NEW')) return <span className="card-badge badge-new">NEW</span>
  if (title.includes('[UNCENSORED]')) return <span className="card-badge badge-uncensored">UNCENSORED</span>
  if (title.includes('[3D]')) return <span className="card-badge badge-3d">3D</span>
  if (title.includes('[L2D]')) return <span className="card-badge badge-l2d">L2D</span>
  return null
}

// Local Storage for favorites
const FAVORITES_KEY = 'nekopoi_favorites'

const getFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  } catch (e) {
    console.error('Failed to save favorites:', e)
  }
}

function App() {
  // State
  const [currentPage, setCurrentPage] = useState('latest')
  const [animeData, setAnimeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [currentStream, setCurrentStream] = useState(0)
  const [favorites, setFavorites] = useState(getFavorites())
  const [bannerIndex, setBannerIndex] = useState(0)
  const [bannerData, setBannerData] = useState([])
  const [showDetail, setShowDetail] = useState(false)

  // Page titles
  const pageTitles = {
    latest: { title: '🎌 Latest Anime' },
    release: { title: '🔥 Latest Releases' },
    favorites: { title: '⭐ My Favorites' },
    search: { title: '🔍 Search Results' }
  }

  // Load initial data
  useEffect(() => {
    loadLatest()
  }, [])

  // Auto-slide banner
  useEffect(() => {
    if (bannerData.length === 0) return
    
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerData.length)
    }, 5000) // 5 seconds

    return () => clearInterval(interval)
  }, [bannerData.length])

  // API Functions
  const loadLatest = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/latest`)
      const data = await response.json()
      
      if (data.success && data.results) {
        setAnimeData(data.results)
        setBannerData(data.results.slice(0, 5)) // Top 5 for banner
        setCurrentPage('latest')
      } else {
        setError('Failed to load data')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadRelease = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/release/1`)
      const data = await response.json()
      
      if (data.data) {
        setAnimeData(data.data)
        setBannerData(data.data.slice(0, 5))
        setCurrentPage('release')
      } else {
        setError('Failed to load data')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/search/${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.data) {
        setAnimeData(data.data)
        setBannerData([])
        setCurrentPage('search')
      } else {
        setError('No results found')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (url) => {
    setLoading(true)
    setError(null)
    setShowDetail(true)
    window.scrollTo(0, 0)
    try {
      const response = await fetch(`${API_BASE}/get?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setSelectedAnime(data.data)
        setCurrentStream(0)
      } else {
        setError('Failed to load detail')
        setSelectedAnime(null)
        setShowDetail(false)
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      setSelectedAnime(null)
      setShowDetail(false)
    } finally {
      setLoading(false)
    }
  }

  // Favorites Functions
  const toggleFavorite = (anime) => {
    const animeId = anime.link || anime.url
    const exists = favorites.find(fav => (fav.link || fav.url) === animeId)
    
    let newFavorites
    if (exists) {
      newFavorites = favorites.filter(fav => (fav.link || fav.url) !== animeId)
    } else {
      newFavorites = [...favorites, anime]
    }
    
    setFavorites(newFavorites)
    saveFavorites(newFavorites)
  }

  const isFavorite = (anime) => {
    const animeId = anime.link || anime.url
    return favorites.some(fav => (fav.link || fav.url) === animeId)
  }

  const showFavorites = () => {
    setAnimeData(favorites)
    setBannerData([])
    setCurrentPage('favorites')
  }

  // Navigation handlers
  const handleNavigation = (page) => {
    if (page === 'latest') loadLatest()
    else if (page === 'release') loadRelease()
    else if (page === 'favorites') showFavorites()
  }

  // Handle search key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') performSearch()
  }

  // Get current page info
  const currentPageInfo = pageTitles[currentPage] || pageTitles.latest

  return (
    <div className="app">
      {showDetail && selectedAnime ? (
        <div className="detail-page">
          <header className="detail-header-nav">
            <button className="back-button" onClick={() => {
              setShowDetail(false)
              setSelectedAnime(null)
            }}>
              ← Back
            </button>
            <div className="logo-detail">
              <span className="logo-icon">🎌</span>
              <span className="logo-text">LuminNhent4i</span>
            </div>
          </header>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p className="loading-text">Loading...</p>
            </div>
          ) : (
            <div className="detail-container">
              <div className="detail-header">
                <h1 className="detail-title">{selectedAnime.title}</h1>
                <div className="detail-meta">
                  {selectedAnime.info}<br />
                  Duration: {selectedAnime.duration || 'N/A'} | Size: {selectedAnime.size || 'N/A'}
                </div>
                {selectedAnime.genre && (
                  <div className="detail-genres">
                    {selectedAnime.genre.split(',').map((genre, idx) => (
                      <span key={idx} className="genre-tag">{genre.trim()}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-body">
                {selectedAnime.streams && selectedAnime.streams.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title">🎬 Watch Online</h3>
                    <div className="stream-tabs">
                      {selectedAnime.streams.map((stream, idx) => (
                        <button
                          key={idx}
                          className={`stream-tab ${idx === currentStream ? 'active' : ''}`}
                          onClick={() => setCurrentStream(idx)}
                        >
                          {stream.name}
                        </button>
                      ))}
                    </div>
                    <div className="video-player">
                      <iframe
                        src={selectedAnime.streams[currentStream]?.url}
                        allowFullScreen
                        title="Video Player"
                      />
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h3 className="section-title">📖 Synopsis</h3>
                  <p className="synopsis-text">{selectedAnime.sinopsis || 'No synopsis available'}</p>
                </div>

                {selectedAnime.download && selectedAnime.download.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title">⬇️ Download</h3>
                    {selectedAnime.download.map((quality, idx) => (
                      <div key={idx} className="download-quality">
                        <h4 className="quality-title">
                          <span className="quality-badge">{quality.type.toUpperCase()}</span>
                          {quality.title}
                        </h4>
                        <div className="download-links">
                          {quality.links.map((link, linkIdx) => (
                            <a
                              key={linkIdx}
                              href={link.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-link"
                            >
                              ⬇️ {link.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <header className="main-header">
            <div className="logo">
              <span className="logo-icon">🎌</span>
              <span className="logo-text">LuminNhent4i</span>
            </div>
          </header>

          {(currentPage === 'latest' || currentPage === 'release') && bannerData.length > 0 && (
            <div className="banner-container">
              <div className="banner-slider" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
                {bannerData.map((anime, index) => (
                  <div 
                    key={index} 
                    className="banner-slide"
                    onClick={() => loadDetail(anime.link || anime.url)}
                  >
                    <img 
                      src={proxyImage(anime.image || anime.img)} 
                      alt={anime.title}
                      className="banner-image"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="banner-content">
                      <h2 className="banner-title">{anime.title}</h2>
                      <p className="banner-info">
                        {anime.upload || anime.duration || 'Click to watch'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="banner-dots">
                {bannerData.map((_, index) => (
                  <div
                    key={index}
                    className={`banner-dot ${index === bannerIndex ? 'active' : ''}`}
                    onClick={() => setBannerIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="container">
            <div className="page-header">
              <h1 className="page-title">{currentPageInfo.title}</h1>
            </div>

            <div className="search-section">
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <button className="search-btn" onClick={performSearch}>
                  Search
                </button>
              </div>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p className="loading-text">Loading...</p>
              </div>
            )}

            {error && !loading && (
              <div className="error">
                <h3>⚠️ {error}</h3>
              </div>
            )}

            {!loading && !error && (
              <>
                {animeData.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📺</div>
                    <p className="empty-text">No anime found</p>
                  </div>
                ) : (
                  <div className="anime-grid">
                    {animeData.map((anime, index) => {
                      const imageUrl = anime.image || anime.img
                      const animeUrl = anime.link || anime.url
                      const duration = anime.duration
                      const uploadDate = anime.upload
                      const genres = anime.genre || []

                      return (
                        <div key={index} className="anime-card">
                          <div 
                            className="card-image-wrapper"
                            onClick={() => loadDetail(animeUrl)}
                          >
                            {getBadge(anime.title)}
                            
                            <button
                              className={`favorite-btn ${isFavorite(anime) ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(anime)
                              }}
                            >
                              {isFavorite(anime) ? '❤️' : '🤍'}
                            </button>

                            {duration && (
                              <div className="card-duration">⏱ {duration}</div>
                            )}

                            <img
                              src={proxyImage(imageUrl)}
                              alt={anime.title}
                              className="card-image"
                              loading="lazy"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>

                          <div 
                            className="card-content"
                            onClick={() => loadDetail(animeUrl)}
                          >
                            <div className="card-title">{anime.title}</div>
                            
                            {uploadDate && (
                              <div className="card-info">
                                📅 {uploadDate}
                              </div>
                            )}

                            {genres.length > 0 && (
                              <div className="genre-pills">
                                {genres.slice(0, 3).map((genre, idx) => (
                                  genre && <span key={idx} className="genre-pill">{genre}</span>
                                ))}
                                {genres.length > 3 && (
                                  <span className="genre-pill">+{genres.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <nav className="bottom-nav">
            <button
              className={`nav-item ${currentPage === 'latest' ? 'active' : ''}`}
              onClick={() => handleNavigation('latest')}
            >
              <span className="nav-icon">🏠</span>
              Latest
            </button>

            <button
              className={`nav-item ${currentPage === 'release' ? 'active' : ''}`}
              onClick={() => handleNavigation('release')}
            >
              <span className="nav-icon">🔥</span>
              Release
            </button>

            <button
              className={`nav-item ${currentPage === 'favorites' ? 'active' : ''}`}
              onClick={() => handleNavigation('favorites')}
            >
              <span className="nav-icon">⭐</span>
              Favorites
              {favorites.length > 0 && (
                <span className="favorite-badge">{favorites.length}</span>
              )}
            </button>
          </nav>
        </>
      )}
    </div>
  )
}

export default App
