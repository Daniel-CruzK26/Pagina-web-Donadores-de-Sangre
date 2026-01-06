// Preguntas de elegibilidad basadas en NOM-253-SSA1-2012
// Criterios oficiales para donación de sangre en México

export const eligibilityQuestions = [
  {
    id: 1,
    question: "¿Tienes entre 18 y 65 años de edad?",
    category: "edad",
    type: "boolean",
    disqualifying: false, // Respuesta "No" descalifica
    explanation: "La edad mínima es 18 años y máxima 65 años según normativa."
  },
  {
    id: 2,
    question: "¿Pesas 50 kilogramos o más?",
    category: "peso",
    type: "boolean",
    disqualifying: false,
    explanation: "El peso mínimo requerido es de 50 kg para donación segura."
  },
  {
    id: 3,
    question: "¿Te sientes bien de salud en este momento? (sin gripe, tos, fiebre o malestar)",
    category: "salud",
    type: "boolean",
    disqualifying: false,
    explanation: "Debes estar completamente sano el día de la donación."
  },
  {
    id: 4,
    question: "¿Has consumido bebidas alcohólicas en las últimas 48 horas?",
    category: "alcohol",
    type: "boolean",
    disqualifying: true, // Respuesta "Sí" descalifica
    explanation: "Debe haber un periodo de 48 horas sin consumo de alcohol."
  },
  {
    id: 5,
    question: "¿Te has hecho tatuajes, perforaciones (piercings) o acupuntura en los últimos 12 meses?",
    category: "tatuajes",
    type: "boolean",
    disqualifying: true,
    explanation: "Periodo de espera de 12 meses por riesgo de infecciones."
  },
  {
    id: 6,
    question: "Si eres mujer: ¿Estás embarazada o en periodo de lactancia?",
    category: "embarazo",
    type: "boolean",
    disqualifying: true,
    explanation: "No es posible donar durante embarazo o lactancia."
  },
  {
    id: 7,
    question: "¿Has donado sangre en los últimos 2 meses (hombres) o 3 meses (mujeres)?",
    category: "donacion_previa",
    type: "boolean",
    disqualifying: true,
    explanation: "Periodo mínimo de recuperación entre donaciones."
  },
  {
    id: 8,
    question: "¿Padeces o has sido diagnosticado con diabetes, hipertensión no controlada, enfermedades cardíacas, hepatitis, VIH/SIDA u otra enfermedad crónica grave?",
    category: "enfermedades",
    type: "boolean",
    disqualifying: true,
    explanation: "Enfermedades transmisibles o crónicas graves impiden la donación."
  },
  {
    id: 9,
    question: "¿Te han realizado alguna cirugía en los últimos 6 meses?",
    category: "cirugias",
    type: "boolean",
    disqualifying: true,
    explanation: "Periodo de recuperación necesario después de cirugías."
  },
  {
    id: 10,
    question: "¿Estás tomando antibióticos u otros medicamentos recetados actualmente?",
    category: "medicamentos",
    type: "boolean",
    disqualifying: true,
    explanation: "Ciertos medicamentos pueden afectar la calidad de la sangre donada."
  },
  {
    id: 11,
    question: "¿Has viajado a zonas endémicas de malaria, zika u otras enfermedades tropicales en los últimos 12 meses?",
    category: "viajes",
    type: "boolean",
    disqualifying: true,
    explanation: "Periodo de espera por riesgo de enfermedades transmisibles."
  },
  {
    id: 12,
    question: "¿Has recibido transfusiones sanguíneas en el último año?",
    category: "transfusiones",
    type: "boolean",
    disqualifying: true,
    explanation: "Periodo de espera de 12 meses después de recibir transfusiones."
  }
];

// Función para evaluar elegibilidad basada en respuestas
export const evaluateEligibility = (answers) => {
  for (const question of eligibilityQuestions) {
    const answer = answers[question.id];
    
    // Si la pregunta es descalificante con "Sí" y el usuario respondió "Sí"
    if (question.disqualifying && answer === true) {
      return {
        eligible: false,
        reason: question.explanation
      };
    }
    
    // Si la pregunta requiere "Sí" (disqualifying: false) y el usuario respondió "No"
    if (!question.disqualifying && answer === false) {
      return {
        eligible: false,
        reason: question.explanation
      };
    }
  }
  
  return {
    eligible: true,
    reason: "Cumples con los requisitos básicos de elegibilidad."
  };
};
