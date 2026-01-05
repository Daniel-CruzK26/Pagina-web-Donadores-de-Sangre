import React from 'react';
import { Activity, Clock, CheckCircle } from 'lucide-react';

const InfoSection = () => {
    const cards = [
        {
            icon: <Activity size={24} />,
            title: "Requisitos Básicos",
            text: "Ser mayor de 18 años, pesar más de 50kg, no estar enfermo el día de la donación y no haber consumido alcohol en las últimas 48 horas."
        },
        {
            icon: <Clock size={24} />,
            title: "Proceso Rápido",
            text: "El proceso de donación dura aproximadamente 30-45 minutos. Es un tiempo breve que tiene un impacto permanente en la vida de alguien."
        },
        {
            icon: <CheckCircle size={24} />,
            title: "Beneficios de Salud",
            text: "Donar sangre mejora tu flujo sanguíneo y ayuda a equilibrar los niveles de hierro en tu cuerpo. Además, recibes un chequeo general gratuito."
        }
    ];

    return (
        <section className="info-section" id="info">
            <div className="container">
                <h2 className="section-title">¿Por qué donar?</h2>
                <div className="cards-grid">
                    {cards.map((card, index) => (
                        <div key={index} className="info-card">
                            <div className="card-icon">
                                {card.icon}
                            </div>
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-text">{card.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default InfoSection;
