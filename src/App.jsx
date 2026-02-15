import { useState, useEffect } from 'react'
// Import ikon Lucide
import { 
  Home, 
  Flame, 
  Star, 
  Heart, 
  Search,
  Clock,
  Calendar,
  Download,
  Film,
  Tv,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Hash,
  Disc3,
  Twitter,
  Send,
  MessageCircle,
  Info,
  Shield,
  FileText,
  Mail,
  PlayCircle,
  BookOpen,
  MonitorPlay
} from 'lucide-react'

// Import Loading Page
import LoadingPage from './components/LoadingPage'

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
  if (title.includes('[NEW')) return <span className="card-badge badge-new"><Sparkles size={12} /> NEW</span>
  if (title.includes('[UNCENSORED]')) return <span className="card-badge badge-uncensored"><MonitorPlay size={12} /> UNCENSORED</span>
  if (title.includes('[3D]')) return <span className="card-badge badge-3d"><Disc3 size={12} /> 3D</span>
  if (title.includes('[L2D]')) return <span className="card-badge badge-l2d"><Film size={12} /> L2D</span>
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
    latest: { title: 'Latest Anime', icon: Home },
    release: { title: 'Latest Releases', icon: Flame },
    favorites: { title: 'My Favorites', icon: Star },
    search: { title: 'Search Results', icon: Search }
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
    }, 5000)

    return () => clearInterval(interval)
  }, [bannerData.length])

  // 🛡️ AD BLOCKER - Block Popups & Overlays
  useEffect(() => {
    const blockPopup = (e) => {
      if (e.target.tagName === 'A' && e.target.target === '_blank') {
        const url = e.target.href || ''
        const adDomains = ['adsterra', 'popads', 'propellerads', 'exoclick', 'clickadu', 'popcash']
        if (adDomains.some(domain => url.toLowerCase().includes(domain))) {
          e.preventDefault()
          e.stopPropagation()
          console.log('🛡️ Blocked ad popup:', url)
          return false
        }
      }
    }

    const originalOpen = window.open
    window.open = function(...args) {
      const url = String(args[0] || '')
      const adDomains = ['adsterra', 'popads', 'propellerads', 'exoclick', 'clickadu', 'popcash']
      
      if (adDomains.some(domain => url.toLowerCase().includes(domain))) {
        console.log('🛡️ Blocked popup window:', url)
        return null
      }
      return originalOpen.apply(this, args)
    }

    const removeOverlays = setInterval(() => {
      const selectors = [
        '[class*="overlay"]',
        '[id*="popup"]',
        '[class*="ad-"]',
        '[class*="captcha"]',
        '[id*="captcha"]',
        'div[style*="position: fixed"]'
      ]
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            const text = el.textContent.toLowerCase()
            const hasAdText = text.includes('robot') || 
                            text.includes('verif') || 
                            text.includes('captcha') ||
                            text.includes('bukan robot')
            
            if (hasAdText && el.parentElement) {
              console.log('🛡️ Removed overlay:', el.className)
              el.remove()
            }
          })
        } catch (e) {
          // Silent fail
        }
      })
    }, 1000)

    document.addEventListener('click', blockPopup, true)
    
    return () => {
      document.removeEventListener('click', blockPopup, true)
      window.open = originalOpen
      clearInterval(removeOverlays)
    }
  }, [])

  // API Functions
  const loadLatest = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/latest`)
      const data = await response.json()
      
      if (data.success && data.results) {
        setAnimeData(data.results)
        setBannerData(data.results.slice(0, 5))
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
  const PageIcon = pageTitles[currentPage]?.icon || Home
  const currentPageInfo = pageTitles[currentPage] || pageTitles.latest

  return (
    <div className="app">
      {/* Tampilkan LoadingPage saat loading dan tidak dalam mode detail */}
      {loading && !showDetail && <LoadingPage />}

      {showDetail && selectedAnime ? (
        <div className="detail-page">
          <header className="detail-header-nav">
            <button className="back-button" onClick={() => {
              setShowDetail(false)
              setSelectedAnime(null)
            }}>
              <ArrowLeft size={20} /> Back
            </button>
            <div className="logo-detail">
              <Film size={24} className="logo-icon" />
              <span className="logo-text">LuminNhent4i</span>
            </div>
          </header>

          {/* Loading di detail page tetap menggunakan spinner biasa */}
          {loading ? (
            <div className="loading">
              <Loader2 size={48} className="spinner" />
              <p className="loading-text">Loading...</p>
            </div>
          ) : (
            <div className="detail-container">
              <div className="detail-header">
                <h1 className="detail-title">{selectedAnime.title}</h1>
                <div className="detail-meta">
                  {selectedAnime.info}<br />
                  <Clock size={16} /> Duration: {selectedAnime.duration || 'N/A'} | <Download size={16} /> Size: {selectedAnime.size || 'N/A'}
                </div>
                {selectedAnime.genre && (
                  <div className="detail-genres">
                    {selectedAnime.genre.split(',').map((genre, idx) => (
                      <span key={idx} className="genre-tag"><Hash size={12} /> {genre.trim()}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-body">
                {selectedAnime.streams && selectedAnime.streams.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title"><PlayCircle size={20} /> Watch Online</h3>
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
                  <h3 className="section-title"><BookOpen size={20} /> Synopsis</h3>
                  <p className="synopsis-text">{selectedAnime.sinopsis || 'No synopsis available'}</p>
                </div>

                {selectedAnime.download && selectedAnime.download.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title"><Download size={20} /> Download</h3>
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
                              <Download size={14} /> {link.name}
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
        /* Hanya tampilkan konten utama jika tidak loading */
        !loading && (
          <>
            <header className="main-header">
              <div className="logo">
                <Film size={28} className="logo-icon" />
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
                <PageIcon size={24} className="page-icon" />
                <h1 className="page-title">{currentPageInfo.title}</h1>
              </div>

              <div className="search-section">
                <div className="search-bar">
                  <Search size={20} className="search-icon" />
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

              {error && !loading && (
                <div className="error">
                  <AlertCircle size={24} />
                  <h3>{error}</h3>
                </div>
              )}

              {!loading && !error && (
                <>
                  {animeData.length === 0 ? (
                    <div className="empty-state">
                      <Tv size={64} className="empty-icon" />
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
                                {isFavorite(anime) ? <Heart size={18} fill="currentColor" /> : <Heart size={18} />}
                              </button>

                              {duration && (
                                <div className="card-duration"><Clock size={14} /> {duration}</div>
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
                                  <Calendar size={14} /> {uploadDate}
                                </div>
                              )}

                              {genres.length > 0 && (
                                <div className="genre-pills">
                                  {genres.slice(0, 3).map((genre, idx) => (
                                    genre && <span key={idx} className="genre-pill"><Hash size={10} /> {genre}</span>
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
                <Home size={20} />
                <span>Latest</span>
              </button>

              <button
                className={`nav-item ${currentPage === 'release' ? 'active' : ''}`}
                onClick={() => handleNavigation('release')}
              >
                <Flame size={20} />
                <span>Release</span>
              </button>

              <button
                className={`nav-item ${currentPage === 'favorites' ? 'active' : ''}`}
                onClick={() => handleNavigation('favorites')}
              >
                <Star size={20} />
                <span>Favorites</span>
                {favorites.length > 0 && (
                  <span className="favorite-badge">{favorites.length}</span>
                )}
              </button>
            </nav>

            <footer className="main-footer">
              <div className="footer-container">
                <div className="footer-top">
                  <div className="footer-brand">
                    <div className="footer-logo">
                      <Film size={24} className="logo-icon" />
                      <span className="logo-text">LuminNhent4i</span>
                    </div>
                    <p className="footer-tagline">Your ultimate destination for anime streaming with Indonesian subtitles</p>
                  </div>

                  <div className="footer-links">
                    <div className="footer-column">
                      <h4>Browse</h4>
                      <ul>
                        <li><a href="#latest"><Home size={14} /> Latest Anime</a></li>
                        <li><a href="#release"><Flame size={14} /> New Releases</a></li>
                        <li><a href="#popular"><Star size={14} /> Popular</a></li>
                        <li><a href="#favorites"><Heart size={14} /> My Favorites</a></li>
                      </ul>
                    </div>

                    <div className="footer-column">
                      <h4>Genres</h4>
                      <ul>
                        <li><a href="#action"><Hash size={14} /> Action</a></li>
                        <li><a href="#romance"><Hash size={14} /> Romance</a></li>
                        <li><a href="#comedy"><Hash size={14} /> Comedy</a></li>
                        <li><a href="#drama"><Hash size={14} /> Drama</a></li>
                      </ul>
                    </div>

                    <div className="footer-column">
                      <h4>Info</h4>
                      <ul>
                        <li><a href="#about"><Info size={14} /> About Us</a></li>
                        <li><a href="#contact"><Mail size={14} /> Contact</a></li>
                        <li><a href="#privacy"><Shield size={14} /> Privacy Policy</a></li>
                        <li><a href="#terms"><FileText size={14} /> Terms of Service</a></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="footer-divider"></div>

                <div className="footer-bottom">
                  <div className="footer-copyright">
                    <p>© {new Date().getFullYear()} LuminNhent4i. All Rights Reserved.</p>
                    <p className="footer-disclaimer">
                      <Info size={12} /> All anime content is provided by third-party sources. We do not host any files on our servers.
                    </p>
                  </div>

                  <div className="footer-social">
                    <p className="footer-powered">Powered by Sanka Vollerei</p>
                    <div className="social-links">
                      <a href="#" aria-label="Discord"><MessageCircle size={18} /></a>
                      <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
                      <a href="#" aria-label="Telegram"><Send size={18} /></a>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )
      )}
    </div>
  )
}

export default App
