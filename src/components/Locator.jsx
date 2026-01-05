import React, { useState, useEffect } from 'react';
import { clinics } from '../data/clinics';
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';

const Locator = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [sortedClinics, setSortedClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

                <div className="clinics-list">
                    {sortedClinics.map((clinic) => (
                        <div key={clinic.id} className="clinic-card">
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
