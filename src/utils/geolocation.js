// Caché para resultados de geocoding
const GEOCODING_CACHE_KEY = 'geocoding_cache'
const CACHE_EXPIRY_DAYS = 30

// Obtener caché
function getCache() {
  try {
    const cache = localStorage.getItem(GEOCODING_CACHE_KEY)
    return cache ? JSON.parse(cache) : {}
  } catch {
    return {}
  }
}

// Guardar en caché
function setCache(key, value) {
  try {
    const cache = getCache()
    cache[key] = {
      data: value,
      timestamp: Date.now()
    }
    localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('Error al guardar en caché:', error)
  }
}

// Verificar si el caché es válido
function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  return Date.now() - cacheEntry.timestamp < expiryTime
}

// Obtener ubicación actual del usuario
export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La geolocalización no está soportada en este navegador'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        let message = 'Error al obtener ubicación'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible'
            break
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    )
  })
}

// Reverse geocoding usando Nominatim (OpenStreetMap)
export async function reverseGeocode(lat, lng) {
  // Crear clave para caché (redondeando a 4 decimales para evitar duplicados muy cercanos)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
  
  // Verificar caché
  const cache = getCache()
  if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
    return cache[cacheKey].data
  }

  try {
    // Llamar a Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      {
        headers: {
          'User-Agent': 'DonadoresdeSangre/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Error en la respuesta de Nominatim')
    }

    const data = await response.json()

    // Formatear dirección
    const address = {
      full: data.display_name || '',
      street: data.address?.road || '',
      city: data.address?.city || data.address?.town || data.address?.municipality || 'Ciudad de México',
      state: data.address?.state || 'CDMX',
      country: data.address?.country || 'México',
      postcode: data.address?.postcode || ''
    }

    // Guardar en caché
    setCache(cacheKey, address)

    return address
  } catch (error) {
    console.error('Error en reverse geocoding:', error)
    // Retornar dirección genérica en caso de error
    return {
      full: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      street: '',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'México',
      postcode: ''
    }
  }
}

// Calcular distancia entre dos puntos usando fórmula de Haversine (retorna km)
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

// Validar que las coordenadas estén en México
export function isInMexico(lat, lng) {
  // Bounding box aproximado de México
  const mexicoBounds = {
    north: 32.72,
    south: 14.53,
    east: -86.71,
    west: -118.45
  }

  return (
    lat >= mexicoBounds.south &&
    lat <= mexicoBounds.north &&
    lng >= mexicoBounds.west &&
    lng <= mexicoBounds.east
  )
}

// Formatear distancia para mostrar
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

// Búsqueda de lugares (geocoding) usando Nominatim
export async function searchPlaces(query, countryCode = 'mx') {
  if (!query || query.trim().length < 3) {
    return []
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `countrycodes=${countryCode}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5&` +
      `accept-language=es`,
      {
        headers: {
          'User-Agent': 'DonadoresdeSangre/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Error en la búsqueda')
    }

    const data = await response.json()

    // Formatear resultados
    return data.map(place => ({
      id: place.place_id,
      name: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      address: {
        street: place.address?.road || '',
        city: place.address?.city || place.address?.town || place.address?.municipality || '',
        state: place.address?.state || '',
        country: place.address?.country || 'México'
      }
    }))
  } catch (error) {
    console.error('Error en búsqueda de lugares:', error)
    return []
  }
}
