import { CheckCircle, XCircle, AlertTriangle, MapPin, RotateCcw } from 'lucide-react';

const ResultsDisplay = ({ result, onRestart }) => {
  const scrollToLocator = () => {
    document.getElementById('locator')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (result.eligible) {
    return (
      <div className="result-panel eligible-result">
        <div className="result-icon">
          <CheckCircle size={64} />
        </div>
        <h2 className="result-title">¡Excelente noticia!</h2>
        <p className="result-message">
          Cumples con los requisitos básicos para donar sangre según la NOM-253-SSA1-2012. 
          Tu donación puede salvar hasta 3 vidas.
        </p>
        <div className="result-actions">
          <button className="btn-primary" onClick={scrollToLocator}>
            <MapPin size={20} />
            Encontrar centros cerca de ti
          </button>
          <button className="btn-secondary" onClick={onRestart}>
            <RotateCcw size={20} />
            Volver a evaluar
          </button>
        </div>
        <div className="disclaimer">
          <AlertTriangle size={18} />
          <p>
            <strong>Importante:</strong> Este cuestionario es orientativo según la NOM-253-SSA1-2012. 
            La evaluación definitiva será realizada por personal médico certificado del centro de donación, 
            incluyendo pruebas de laboratorio y examen físico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="result-panel ineligible-result">
      <div className="result-icon">
        <XCircle size={64} />
      </div>
      <h2 className="result-title">En este momento no puedes donar</h2>
      <p className="result-message">
        Según tus respuestas, actualmente no cumples con todos los requisitos establecidos 
        en la NOM-253-SSA1-2012 para donación de sangre.
      </p>
      <div className="result-info">
        <p>
          <strong>¿Qué puedo hacer?</strong>
        </p>
        <ul>
          <li>Consulta con el personal médico de un centro de donación para obtener información específica</li>
          <li>Algunos requisitos tienen periodos de espera temporales</li>
          <li>Puedes volver a evaluarte cuando tus circunstancias cambien</li>
        </ul>
      </div>
      <div className="result-actions">
        <button className="btn-secondary" onClick={onRestart}>
          <RotateCcw size={20} />
          Hacer otra evaluación
        </button>
      </div>
      <div className="disclaimer">
        <AlertTriangle size={18} />
        <p>
          <strong>Importante:</strong> Este cuestionario es orientativo según la NOM-253-SSA1-2012. 
          Para información detallada sobre tu caso específico, consulta con personal médico certificado 
          de un centro de donación.
        </p>
      </div>
    </div>
  );
};

export default ResultsDisplay;
