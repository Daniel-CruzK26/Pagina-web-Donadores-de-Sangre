import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clinics } from '../data/clinics';
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for user location - Google Maps style blue dot
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: '<div class="custom-user-marker"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

// Custom icon for clinics - Blood drop emoji/icon
const clinicIcon = L.divIcon({
  className: 'custom-clinic-marker',
  html: '🩸',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const Locator = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [sortedClinics, setSortedClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const mapRef = useRef(null);

    // Haversine formula to calculate distance between two coordinates in km
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const handleGetLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("La geolocalización no es soportada por tu navegador.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                
                const clinicsWithDistance = clinics.map(clinic => {
                    const distance = calculateDistance(latitude, longitude, clinic.lat, clinic.lng);
                    return { ...clinic, distance };
                });

                // Sort by distance
                clinicsWithDistance.sort((a, b) => a.distance - b.distance);
                setSortedClinics(clinicsWithDistance);
                setLoading(false);
            },
            () => {
                setError("No pudimos obtener tu ubicación. Por favor permite el acceso para encontrar clínicas cercanas.");
                setLoading(false);
            }
        );
    };

    // Initialize with unsorted list or just empty
    useEffect(() => {
        // If we don't have location yet, just show clinics as is (or empty)
        if (!userLocation) {
            setSortedClinics(clinics.map(c => ({...c, distance: null})));
        }
    }, [userLocation]);

    // Function to center map on a specific clinic
    const handleClinicClick = (clinic) => {
        setSelectedClinic(clinic);
        if (mapRef.current) {
            mapRef.current.setView([clinic.lat, clinic.lng], 15);
        }
    };

    // Default center (Mexico City)
    const defaultCenter = [19.4326, -99.1332];
    const mapCenter = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : (sortedClinics.length > 0 ? [sortedClinics[0].lat, sortedClinics[0].lng] : defaultCenter);

    return (
        <section className="locator-section" id="locator">
            <div className="container">
                <div className="locator-header">
                    <h2 className="section-title">Encuentra una Clínica</h2>
                    <p className="hero-subtitle">Descubre los bancos de sangre más cercanos a tu ubicación actual.</p>
                </div>

                <div className="locator-controls">
                    <button onClick={handleGetLocation} className="btn-primary" disabled={loading}>
                        {loading ? 'Localizando...' : (
                            <>
                                <Navigation size={20} />
                                Usar mi ubicación actual
                            </>
                        )}
                    </button>
                </div>

                {error && <p style={{textAlign: 'center', color: 'red', marginBottom: '2rem'}}>{error}</p>}

                {/* Interactive Map */}
                <div className="map-container">
                    <MapContainer 
                        center={mapCenter} 
                        zoom={12} 
                        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
                        ref={mapRef}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {/* User location marker */}
                        {userLocation && (
                            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                <Popup>
                                    <strong>Tu ubicación</strong>
                                </Popup>
                            </Marker>
                        )}

                        {/* Clinic markers */}
                        {sortedClinics.map((clinic) => (
                            <Marker 
                                key={clinic.id} 
                                position={[clinic.lat, clinic.lng]}
                                icon={clinicIcon}
                            >
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{clinic.name}</h3>
                                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={14} />
                                            {clinic.address}
                                        </p>
                                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Phone size={14} />
                                            {clinic.phone}
                                        </p>
                                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={14} />
                                            {clinic.hours}
                                        </p>
                                        {clinic.distance !== null && (
                                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
                                                {clinic.distance.toFixed(1)} km de distancia
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="clinics-list">
                    {sortedClinics.map((clinic) => (
                        <div 
                            key={clinic.id} 
                            className={`clinic-card ${selectedClinic?.id === clinic.id ? 'selected' : ''}`}
                            onClick={() => handleClinicClick(clinic)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="clinic-info">
                                <h3>{clinic.name}</h3>
                                <div className="clinic-address">
                                    <MapPin size={16} />
                                    <span>{clinic.address}</span>
                                </div>
                                <div className="clinic-details">
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <Phone size={14} />
                                        <span>{clinic.phone}</span>
                                    </div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <Clock size={14} />
                                        <span>{clinic.hours}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="clinic-distance">
                                {clinic.distance !== null ? (
                                    <span className="distance-badge">
                                        {clinic.distance.toFixed(1)} km
                                    </span>
                                ) : (
                                    // Placeholder if distance not calculated yet
                                    <span style={{color: '#ccc'}}>- km</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Locator;
