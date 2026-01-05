import React from 'react';
import { MapPin } from 'lucide-react';

const Hero = () => {
    return (
        <section className="hero" id="inicio">
            <div className="container">
                <h1 className="hero-title">
                    Tu sangre puede <br />
                    <span className="hero-highlight">salvar 3 vidas</span>
                </h1>
                <p className="hero-subtitle">
                    Convertirse en donador voluntario es un acto de amor y solidaridad. Encuentra el banco de sangre más cercano y únete a la causa hoy mismo.
                </p>
                <a href="#locator" className="btn-primary">
                    <MapPin size={20} />
                    Encontrar Clínica Cercana
                </a>
            </div>
        </section>
    );
};

export default Hero;
