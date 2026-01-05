import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <p>&copy; {new Date().getFullYear()} Donadores. Todos los derechos reservados.</p>
                <p className="footer-text">Proyecto altruista para la concientización de donación de sangre.</p>
            </div>
        </footer>
    );
};

export default Footer;
