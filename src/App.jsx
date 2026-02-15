import { useState, useEffect } from 'react'
// Import ikon Lucide
import { 
  Home as HomeIcon, 
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
  MonitorPlay,
  CalendarDays,
  ChevronRight,
  TrendingUp
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

// Komponen Anime Card (untuk grid)
const AnimeCard = ({ anime, isFavorite, onToggleFavorite, onClick }) => {
  const imageUrl = anime.image || anime.img
  const duration = anime.duration
  const uploadDate = anime.upload
  const genres = anime.genre || []

  return (
    <div className="anime-card" onClick={onClick}>
      <div className="card-image-wrapper">
        {getBadge(anime.title)}
        
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>

        {duration && (
          <div className="card-duration">
            <Clock size={10} /> {duration}
          </div>
        )}

        <img
          src={proxyImage(imageUrl)}
          alt={anime.title}
          className="card-image"
          loading="lazy"
          onError={(e) => e.target.style.display = 'none'}
        />
      </div>

      <div className="card-content">
        <div className="card-title">{anime.title}</div>
        
        {uploadDate && (
          <div className="card-info">
            <Calendar size={10} /> {uploadDate}
          </div>
        )}

        {genres.length > 0 && (
          <div className="genre-pills">
            {genres.slice(0, 2).map((genre, idx) => (
              genre && <span key={idx} className="genre-pill"><Hash size={8} /> {genre}</span>
            ))}
            {genres.length > 2 && (
              <span className="genre-pill">+{genres.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Komponen Release Row Card (untuk horizontal scroll)
const ReleaseRowCard = ({ anime, isFavorite, onToggleFavorite, onClick }) => {
  return (
    <div className="release-row-card" onClick={onClick}>
      <div className="release-row-image">
        <img src={proxyImage(anime.image || anime.img)} alt={anime.title} />
        {anime.title.includes('[NEW') && (
          <span className="release-row-badge">
            <Sparkles size={8} /> NEW
          </span>
        )}
        <button
          className={`release-row-favorite ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          <Heart size={12} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="release-row-content">
        <div className="release-row-title-text">{anime.title}</div>
        <div className="release-row-meta">
          <Clock size={8} /> {anime.duration || 'N/A'}
        </div>
        <div className="release-row-genres">
          {anime.genre?.slice(0, 2).map((g, i) => (
            <span key={i} className="release-row-genre">{g}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  // State
  const [currentPage, setCurrentPage] = useState('home')
  const [homeData, setHomeData] = useState({
    banner: [],
    latest: [],
    releases: [],
    popular: []
  })
  const [animeData, setAnimeData] = useState([])
  const [loading, setLoading] = useState({
    home: true,
    page: false,
    loadingMore: false
  })
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [currentStream, setCurrentStream] = useState(0)
  const [favorites, setFavorites] = useState(getFavorites())
  const [bannerIndex, setBannerIndex] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  
  // State untuk pagination
  const [releasePages, setReleasePages] = useState({
    currentPage: 1,
    totalPages: 10,
    data: []
  })

  // Page titles
  const pageTitles = {
    home: { title: 'Home', icon: HomeIcon },
    latest: { title: 'Latest Anime', icon: Flame },
    release: { title: 'New Releases', icon: CalendarDays },
    favorites: { title: 'My Favorites', icon: Star },
    search: { title: 'Search Results', icon: Search }
  }

  // ===== LOAD MULTI-PAGE RELEASES =====
  const loadAllReleases = async (maxPages = 5) => {
    try {
      const allReleases = []
      for (let page = 1; page <= maxPages; page++) {
        const response = await fetch(`${API_BASE}/release/${page}`)
        const data = await response.json()
        if (data.data) {
          allReleases.push(...data.data)
        }
        // Small delay biar ga overload
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return allReleases
    } catch (error) {
      console.error('Error loading multi-page releases:', error)
      return []
    }
  }

  // ===== LOAD HOME DATA =====
  const loadHomeData = async () => {
    setLoading(prev => ({ ...prev, home: true }))
    setError(null)
    
    try {
      // Fetch data secara paralel
      const [latestResponse, releaseResponse, allReleases] = await Promise.all([
        fetch(`${API_BASE}/latest`),
        fetch(`${API_BASE}/release/1`),
        loadAllReleases(5) // Ambil 5 halaman release
      ])

      const latestData = await latestResponse.json()
      const releaseData = await releaseResponse.json()

      // Banner dari page 1 release (5 item)
      const bannerItems = releaseData.data?.slice(0, 5) || []
      
      // Latest (8 item)
      const latestItems = latestData.success ? latestData.results.slice(0, 8) : []
      
      // All releases dari multi-page (unique)
      const uniqueReleases = Array.from(
        new Map(allReleases.map(item => [item.link || item.url, item])).values()
      ).slice(0, 24) // Ambil 24 item untuk 3 baris

      // Popular (mix dari latest dan releases)
      const popularItems = [
        ...(latestData.success ? latestData.results.slice(0, 4) : []),
        ...(allReleases.slice(0, 4) || [])
      ].slice(0, 8)

      setHomeData({
        banner: bannerItems,
        latest: latestItems,
        releases: uniqueReleases,
        popular: popularItems
      })

      setReleasePages(prev => ({
        ...prev,
        data: allReleases
      }))

    } catch (err) {
      setError(`Error loading home: ${err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, home: false }))
    }
  }

  // ===== LOAD LATEST PAGE =====
  const loadLatest = async () => {
    setLoading(prev => ({ ...prev, page: true }))
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/latest`)
      const data = await response.json()
      
      if (data.success && data.results) {
        setAnimeData(data.results)
        setCurrentPage('latest')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, page: false }))
    }
  }

  // ===== LOAD RELEASE PAGE =====
  const loadRelease = async () => {
    setLoading(prev => ({ ...prev, page: true }))
    setError(null)
    try {
      // Ambil semua release pages untuk halaman release
      const allReleases = []
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`${API_BASE}/release/${page}`)
        const data = await response.json()
        if (data.data) {
          allReleases.push(...data.data)
        }
      }
      
      // Filter duplikat
      const uniqueReleases = Array.from(
        new Map(allReleases.map(item => [item.link || item.url, item])).values()
      )
      
      setAnimeData(uniqueReleases)
      setCurrentPage('release')
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, page: false }))
    }
  }

  // ===== SEARCH =====
  const performSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(prev => ({ ...prev, page: true }))
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/search/${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.data) {
        setAnimeData(data.data)
        setCurrentPage('search')
      } else {
        setError('No results found')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, page: false }))
    }
  }

  // ===== LOAD DETAIL =====
  const loadDetail = async (url) => {
    setLoading(prev => ({ ...prev, page: true }))
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
      setLoading(prev => ({ ...prev, page: false }))
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
    setCurrentPage('favorites')
  }

  // Search di favorites
  const searchInFavorites = () => {
    if (!searchQuery.trim()) {
      setAnimeData(favorites)
      return
    }
    
    const filtered = favorites.filter(anime => 
      anime.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setAnimeData(filtered)
  }

  // Navigation handlers
  const handleNavigation = (page) => {
    if (page === 'home') {
      setCurrentPage('home')
      window.scrollTo(0, 0)
    } else if (page === 'latest') {
      loadLatest()
    } else if (page === 'release') {
      loadRelease()
    } else if (page === 'favorites') {
      showFavorites()
    }
  }

  // Handle search key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (currentPage === 'favorites') {
        searchInFavorites()
      } else {
        performSearch()
      }
    }
  }

  // Handle search button click
  const handleSearchClick = () => {
    if (currentPage === 'favorites') {
      searchInFavorites()
    } else {
      performSearch()
    }
  }

  // Load home data on initial render
  useEffect(() => {
    loadHomeData()
  }, [])

  // Auto-slide banner hanya di home
  useEffect(() => {
    if (currentPage !== 'home' || homeData.banner.length === 0) return
    
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % homeData.banner.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [currentPage, homeData.banner.length])

  // Get current page info
  const PageIcon = pageTitles[currentPage]?.icon || HomeIcon

  // ===== RENDER HOME PAGE =====
  const renderHomePage = () => {
    if (loading.home) return <LoadingPage />

    // Bagi data releases menjadi 3 baris
    const row1 = homeData.releases.slice(0, 8)
    const row2 = homeData.releases.slice(8, 16)
    const row3 = homeData.releases.slice(16, 24)

    return (
      <>
        {/* Banner hanya di HOME */}
        {homeData.banner.length > 0 && (
          <div className="banner-container">
            <div className="banner-slider" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
              {homeData.banner.map((anime, index) => (
                <div 
                  key={index} 
                  className="banner-slide"
                  onClick={() => loadDetail(anime.link || anime.url)}
                >
                  <img 
                    src={proxyImage(anime.image || anime.img)} 
                    alt={anime.title}
                    className="banner-image"
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
              {homeData.banner.map((_, index) => (
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
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button className="search-btn" onClick={handleSearchClick}>
                Cari
              </button>
            </div>
          </div>

          {/* Section Latest */}
          <section className="home-section">
            <div className="section-header">
              <h2 className="section-title">
                <Flame size={20} className="section-icon" />
                Latest Anime
              </h2>
              <button 
                className="view-all-btn"
                onClick={() => handleNavigation('latest')}
              >
                Lihat Semua <ChevronRight size={16} />
              </button>
            </div>
            
            {homeData.latest.length > 0 ? (
              <div className="anime-grid">
                {homeData.latest.map((anime, index) => (
                  <AnimeCard 
                    key={index}
                    anime={anime}
                    isFavorite={isFavorite(anime)}
                    onToggleFavorite={() => toggleFavorite(anime)}
                    onClick={() => loadDetail(anime.link || anime.url)}
                  />
                ))}
              </div>
            ) : (
              <div className="section-empty">Tidak ada anime terbaru</div>
            )}
          </section>

          {/* Section Releases with Multi-Row Scroll */}
          <section className="home-section">
            <div className="section-header">
              <h2 className="section-title">
                <CalendarDays size={20} className="section-icon" />
                New Releases
              </h2>
              <button 
                className="view-all-btn"
                onClick={() => handleNavigation('release')}
              >
                Lihat Semua <ChevronRight size={16} />
              </button>
            </div>

            {homeData.releases.length > 0 && (
              <div className="release-multi-row">
                {/* BARIS 1 */}
                {row1.length > 0 && (
                  <div className="release-row">
                    <div className="release-row-header">
                      <span className="release-row-title">
                        <TrendingUp size={14} /> Baru Rilis #1
                      </span>
                    </div>
                    <div className="release-row-scroll">
                      {row1.map((anime, index) => (
                        <ReleaseRowCard 
                          key={`row1-${index}`}
                          anime={anime}
                          isFavorite={isFavorite(anime)}
                          onToggleFavorite={() => toggleFavorite(anime)}
                          onClick={() => loadDetail(anime.link || anime.url)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* BARIS 2 */}
                {row2.length > 0 && (
                  <div className="release-row">
                    <div className="release-row-header">
                      <span className="release-row-title">
                        <TrendingUp size={14} /> Baru Rilis #2
                      </span>
                    </div>
                    <div className="release-row-scroll">
                      {row2.map((anime, index) => (
                        <ReleaseRowCard 
                          key={`row2-${index}`}
                          anime={anime}
                          isFavorite={isFavorite(anime)}
                          onToggleFavorite={() => toggleFavorite(anime)}
                          onClick={() => loadDetail(anime.link || anime.url)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* BARIS 3 */}
                {row3.length > 0 && (
                  <div className="release-row">
                    <div className="release-row-header">
                      <span className="release-row-title">
                        <TrendingUp size={14} /> Baru Rilis #3
                      </span>
                    </div>
                    <div className="release-row-scroll">
                      {row3.map((anime, index) => (
                        <ReleaseRowCard 
                          key={`row3-${index}`}
                          anime={anime}
                          isFavorite={isFavorite(anime)}
                          onToggleFavorite={() => toggleFavorite(anime)}
                          onClick={() => loadDetail(anime.link || anime.url)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section Popular (Opsional) */}
          {homeData.popular.length > 0 && (
            <section className="home-section">
              <div className="section-header">
                <h2 className="section-title">
                  <TrendingUp size={20} className="section-icon" />
                  Popular This Week
                </h2>
              </div>
              
              <div className="anime-grid">
                {homeData.popular.map((anime, index) => (
                  <AnimeCard 
                    key={index}
                    anime={anime}
                    isFavorite={isFavorite(anime)}
                    onToggleFavorite={() => toggleFavorite(anime)}
                    onClick={() => loadDetail(anime.link || anime.url)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </>
    )
  }

  // ===== RENDER REGULAR PAGE (Latest, Release, Favorites) =====
  const renderRegularPage = () => {
    if (loading.page) return <LoadingPage />

    return (
      <div className="container">
        <div className="page-header">
          <PageIcon size={24} className="page-icon" />
          <h1 className="page-title">{pageTitles[currentPage]?.title}</h1>
        </div>

        {/* Search Bar - Ada di semua halaman */}
        <div className="search-section">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={currentPage === 'favorites' ? "Cari di favorites..." : "Cari anime..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <button className="search-btn" onClick={handleSearchClick}>
              Cari
            </button>
          </div>
        </div>

        {error && !loading.page && (
          <div className="error">
            <AlertCircle size={20} />
            <h3>{error}</h3>
          </div>
        )}

        {!loading.page && !error && (
          <>
            {animeData.length === 0 ? (
              <div className="empty-state">
                <Tv size={48} className="empty-icon" />
                <p className="empty-text">
                  {currentPage === 'favorites' 
                    ? 'Belum ada anime favorit' 
                    : 'Tidak ada anime ditemukan'}
                </p>
              </div>
            ) : (
              <div className="anime-grid">
                {animeData.map((anime, index) => (
                  <AnimeCard 
                    key={index}
                    anime={anime}
                    isFavorite={isFavorite(anime)}
                    onToggleFavorite={() => toggleFavorite(anime)}
                    onClick={() => loadDetail(anime.link || anime.url)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      {/* Loading Page untuk initial load */}
      {loading.home && currentPage === 'home' && <LoadingPage />}

      {/* Detail Page */}
      {showDetail && selectedAnime ? (
        <div className="detail-page">
          <header className="detail-header-nav">
            <button className="back-button" onClick={() => {
              setShowDetail(false)
              setSelectedAnime(null)
            }}>
              <ArrowLeft size={20} /> Kembali
            </button>
            <div className="logo-detail">
              <Film size={24} className="logo-icon" />
              <span className="logo-text">LuminNhent4i</span>
            </div>
          </header>

          {loading.page ? (
            <div className="loading">
              <Loader2 size={40} className="spinner" />
              <p className="loading-text">Loading...</p>
            </div>
          ) : (
            <div className="detail-container">
              <div className="detail-header">
                <h1 className="detail-title">{selectedAnime.title}</h1>
                <div className="detail-meta">
                  {selectedAnime.info}<br />
                  <Clock size={14} /> Durasi: {selectedAnime.duration || 'N/A'} | <Download size={14} /> Ukuran: {selectedAnime.size || 'N/A'}
                </div>
                {selectedAnime.genre && (
                  <div className="detail-genres">
                    {selectedAnime.genre.split(',').map((genre, idx) => (
                      <span key={idx} className="genre-tag"><Hash size={10} /> {genre.trim()}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-body">
                {selectedAnime.streams && selectedAnime.streams.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title"><PlayCircle size={18} /> Watch Online</h3>
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
                  <h3 className="section-title"><BookOpen size={18} /> Sinopsis</h3>
                  <p className="synopsis-text">{selectedAnime.sinopsis || 'Tidak ada sinopsis'}</p>
                </div>

                {selectedAnime.download && selectedAnime.download.length > 0 && (
                  <div className="detail-section">
                    <h3 className="section-title"><Download size={18} /> Download</h3>
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
                              <Download size={12} /> {link.name}
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
        /* Main Pages */
        <>
          <header className="main-header">
            <div className="logo">
              <Film size={24} className="logo-icon" />
              <span className="logo-text">LuminNhent4i</span>
            </div>
          </header>

          {/* Render berdasarkan halaman */}
          {currentPage === 'home' && renderHomePage()}
          {currentPage !== 'home' && renderRegularPage()}

          {/* Bottom Navigation - 4 Icon */}
          <nav className="bottom-nav">
            <button
              className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => handleNavigation('home')}
            >
              <HomeIcon size={20} />
              <span>Home</span>
            </button>

            <button
              className={`nav-item ${currentPage === 'latest' ? 'active' : ''}`}
              onClick={() => handleNavigation('latest')}
            >
              <Flame size={20} />
              <span>Latest</span>
            </button>

            <button
              className={`nav-item ${currentPage === 'release' ? 'active' : ''}`}
              onClick={() => handleNavigation('release')}
            >
              <CalendarDays size={20} />
              <span>Release</span>
            </button>

            <button
              className={`nav-item ${currentPage === 'favorites' ? 'active' : ''}`}
              onClick={() => handleNavigation('favorites')}
            >
              <Star size={20} />
              <span>Fav</span>
              {favorites.length > 0 && (
                <span className="favorite-badge">{favorites.length}</span>
              )}
            </button>
          </nav>

          {/* Footer */}
          <footer className="main-footer">
            <div className="footer-container">
              <div className="footer-top">
                <div className="footer-brand">
                  <div className="footer-logo">
                    <Film size={20} className="logo-icon" />
                    <span className="logo-text">LuminNhent4i</span>
                  </div>
                  <p className="footer-tagline">Nonton anime subtitle Indonesia</p>
                </div>

                <div className="footer-links">
                  <div className="footer-column">
                    <h4>Menu</h4>
                    <ul>
                      <li><a href="#" onClick={() => handleNavigation('home')}>Home</a></li>
                      <li><a href="#" onClick={() => handleNavigation('latest')}>Latest</a></li>
                      <li><a href="#" onClick={() => handleNavigation('release')}>Release</a></li>
                      <li><a href="#" onClick={() => handleNavigation('favorites')}>Favorites</a></li>
                    </ul>
                  </div>

                  <div className="footer-column">
                    <h4>Info</h4>
                    <ul>
                      <li><a href="#">Tentang</a></li>
                      <li><a href="#">Kontak</a></li>
                      <li><a href="#">Privacy</a></li>
                      <li><a href="#">Terms</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="footer-divider"></div>

              <div className="footer-bottom">
                <div className="footer-copyright">
                  <p>© 2024 LuminNhent4i</p>
                </div>
                <div className="footer-social">
                  <a href="#"><Twitter size={16} /></a>
                  <a href="#"><MessageCircle size={16} /></a>
                  <a href="#"><Send size={16} /></a>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
