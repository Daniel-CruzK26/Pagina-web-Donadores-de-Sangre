import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Navigation } from 'lucide-react'
import { getCurrentPosition, reverseGeocode, isInMexico } from '../utils/geolocation'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix para iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null)

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker != null) {
        const newPos = marker.getLatLng()
        onPositionChange(newPos.lat, newPos.lng)
      }
    },
  }

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  )
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapPicker({ onLocationSelect, initialPosition }) {
  const [position, setPosition] = useState(
    initialPosition || [19.4326, -99.1332] // Centro CDMX por defecto
  )
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [map, setMap] = useState(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Solo inicializar una vez cuando initialPosition cambia
    if (initialPosition && !hasInitialized.current) {
      hasInitialized.current = true
      setPosition(initialPosition)
      handlePositionChange(initialPosition[0], initialPosition[1])
    }
  }, []) // Array vacío - solo ejecutar al montar

  const handlePositionChange = async (lat, lng) => {
    setPosition([lat, lng])
    setLoading(true)

    // Validar que esté en México
    if (!isInMexico(lat, lng)) {
      toast.error('Por favor selecciona una ubicación dentro de México')
    }

    try {
      const addressData = await reverseGeocode(lat, lng)
      const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state}`
      setAddress(formattedAddress)

      if (onLocationSelect) {
        onLocationSelect(lat, lng, formattedAddress, addressData)
      }
    } catch (error) {
      console.error('Error al obtener dirección:', error)
      toast.error('No se pudo obtener la dirección')
    } finally {
      setLoading(false)
    }
  }

  const handleUseMyLocation = async () => {
    setLoading(true)
    try {
      const location = await getCurrentPosition()
      setPosition([location.lat, location.lng])
      
      if (map) {
        map.flyTo([location.lat, location.lng], 15, {
          duration: 1.5
        })
      }

      await handlePositionChange(location.lat, location.lng)
      toast.success('Ubicación actualizada')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Navigation size={18} />
          {loading ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
        </button>

        {address && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              <strong>Dirección:</strong> {address}
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          height: '400px',
          borderRadius: 'var(--border-radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          border: '2px solid #e0e0e0'
        }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker
            position={position}
            onPositionChange={handlePositionChange}
          />
          <MapClickHandler onMapClick={handlePositionChange} />
        </MapContainer>
      </div>

      <p
        style={{
          marginTop: '0.75rem',
          fontSize: '0.85rem',
          color: '#666',
          textAlign: 'center'
        }}
      >
        Arrastra el marcador o haz clic en el mapa para seleccionar la ubicación del hospital
      </p>
    </div>
  )
}
