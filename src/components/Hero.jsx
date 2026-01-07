import { Link } from 'react-router-dom';
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
                <Link to="/clinicas" className="btn-primary">
                    <MapPin size={20} />
                    Encontrar Clínica Cercana
                </Link>
            </div>
        </section>
    );
};

export default Hero;
