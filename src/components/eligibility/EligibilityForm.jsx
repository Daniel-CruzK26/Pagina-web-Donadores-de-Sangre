import { useState } from 'react';
import { ClipboardList, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { eligibilityQuestions, evaluateEligibility } from '../../data/eligibilityQuestions';
import ResultsDisplay from './ResultsDisplay';

const EligibilityForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentQuestion = eligibilityQuestions[currentStep];
  const totalQuestions = eligibilityQuestions.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;

  const handleAnswer = (answer) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnswers({ ...answers, [currentQuestion.id]: answer });

    setTimeout(() => {
      if (currentStep < totalQuestions - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Última pregunta - evaluar y mostrar resultado
        const finalAnswers = { ...answers, [currentQuestion.id]: answer };
        const evaluationResult = evaluateEligibility(finalAnswers);
        setResult(evaluationResult);
        setShowResult(true);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevious = () => {
    if (currentStep > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
    setIsAnimating(false);
  };

  if (showResult) {
    return (
      <section id="eligibility" className="eligibility-section">
        <div className="eligibility-container">
          <ResultsDisplay result={result} onRestart={handleRestart} />
        </div>
      </section>
    );
  }

  return (
    <section id="eligibility" className="eligibility-section">
      <div className="eligibility-container">
        <div className="eligibility-header">
          <div className="header-icon">
            <ClipboardList size={32} />
          </div>
          <h2>Evaluación de Elegibilidad para Donación</h2>
          <p className="time-estimate">
            <Clock size={16} />
            <span>2-3 minutos</span>
          </p>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="progress-text">
          Pregunta {currentStep + 1} de {totalQuestions}
        </div>

        <div className={`question-card ${isAnimating ? 'animating' : ''}`}>
          <h3 className="question-text">{currentQuestion.question}</h3>
          
          <div className="answer-buttons">
            <button 
              className="answer-btn answer-yes"
              onClick={() => handleAnswer(true)}
              disabled={isAnimating}
            >
              Sí
            </button>
            <button 
              className="answer-btn answer-no"
              onClick={() => handleAnswer(false)}
              disabled={isAnimating}
            >
              No
            </button>
          </div>
        </div>

        <div className="navigation-buttons">
          {currentStep > 0 && (
            <button 
              className="btn-navigation btn-previous"
              onClick={handlePrevious}
              disabled={isAnimating}
            >
              <ArrowLeft size={20} />
              Anterior
            </button>
          )}
          <div className="nav-spacer"></div>
        </div>
      </div>
    </section>
  );
};

export default EligibilityForm;
