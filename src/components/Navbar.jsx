import React from 'react';
import { Heart } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container nav-content">
                <a href="#" className="nav-logo">
                    <Heart fill="currentColor" />
                    <span>Donadores</span>
                </a>
                <div className="nav-links">
                    <a href="#inicio" className="nav-link">Inicio</a>
                    <a href="#eligibility" className="nav-link">¿Puedo donar?</a>
                    <a href="#info" className="nav-link">¿Por qué donar?</a>
                    <a href="#locator" className="nav-link">Encontrar Clínica</a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
