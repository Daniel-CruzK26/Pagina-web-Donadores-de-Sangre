import { useState, useEffect, useRef } from 'react'
import { searchPlaces } from '../utils/geolocation'
import { MapPin, Search, Loader } from 'lucide-react'

export function HospitalAutocomplete({ value, onChange, onPlaceSelect, disabled }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimer = useRef(null)
  const wrapperRef = useRef(null)

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar lugares con debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.trim().length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    debounceTimer.current = setTimeout(async () => {
      const results = await searchPlaces(query)
      setSuggestions(results)
      setShowSuggestions(true)
      setLoading(false)
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)
  }

  const handleSelectPlace = (place) => {
    setQuery(place.name)
    onChange(place.name)
    setShowSuggestions(false)
    setSuggestions([])
    
    if (onPlaceSelect) {
      onPlaceSelect(place)
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={(e) => {
            if (suggestions.length > 0) setShowSuggestions(true)
            if (!disabled) e.target.style.borderColor = 'var(--primary-color)'
          }}
          onBlur={(e) => {
            if (!disabled) e.target.style.borderColor = '#e0e0e0'
          }}
          placeholder="Escribe el nombre del hospital..."
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 1rem',
            border: '2px solid #e0e0e0',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '1rem',
            transition: 'border-color 0.3s ease',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }}
        >
          {loading ? <Loader size={18} className="spin" /> : <Search size={18} />}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '2px solid #e0e0e0',
            borderTop: 'none',
            borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000
          }}
        >
          {suggestions.map((place) => (
            <div
              key={place.id}
              onClick={() => handleSelectPlace(place)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                <MapPin size={18} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                    {place.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {place.address.city}, {place.address.state}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
