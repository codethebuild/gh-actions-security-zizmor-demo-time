import { useState, useEffect, useCallback } from 'react'
import './SlideDeck.css'

function SlideDeck({ slides }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'Home') {
        setCurrentSlide(0)
      } else if (e.key === 'End') {
        setCurrentSlide(slides.length - 1)
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, toggleFullscreen, slides.length])

  useEffect(() => {
    let timeout
    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Initial timeout
    timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const slide = slides[currentSlide]

  return (
    <div className="slide-deck">
      <div className={`slide slide-${slide.type}`}>
        <div className="slide-content">
          {slide.type === 'title' && slide.title && <h1 className="slide-title">{slide.title}</h1>}
          {slide.type === 'content' && slide.title && (
            <h2 className="slide-title">{slide.title}</h2>
          )}
          {slide.subtitle && <h2 className="slide-subtitle">{slide.subtitle}</h2>}
          {slide.content && (
            <div className="slide-body">
              {Array.isArray(slide.content) ? (
                <ul className="slide-list">
                  {slide.content.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{slide.content}</p>
              )}
            </div>
          )}
          {slide.footer && <div className="slide-footer">{slide.footer}</div>}
        </div>
      </div>

      <div className={`controls ${showControls ? 'visible' : 'hidden'}`}>
        <button onClick={prevSlide} className="control-btn">
          ←
        </button>
        <span className="slide-counter">
          {currentSlide + 1} / {slides.length}
        </span>
        <button onClick={nextSlide} className="control-btn">
          →
        </button>
        <button
          onClick={toggleFullscreen}
          className="control-btn fullscreen-btn"
          title="Toggle Fullscreen (F)"
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className={`help-text ${showControls ? 'visible' : 'hidden'}`}>
        Use arrow keys or space to navigate • Home/End for first/last slide • F for fullscreen
      </div>
    </div>
  )
}

export default SlideDeck
