// Compatibilidad de tipos de sangre
// Cada tipo puede donar a los tipos en su array
export const BLOOD_TYPE_COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
}

// Obtener tipos de sangre que pueden donar a un paciente específico
export function getCompatibleDonors(patientBloodType) {
  const compatibleTypes = []
  
  for (const [donorType, canDonateTo] of Object.entries(BLOOD_TYPE_COMPATIBILITY)) {
    if (canDonateTo.includes(patientBloodType)) {
      compatibleTypes.push(donorType)
    }
  }
  
  return compatibleTypes
}

// Verificar si un donador puede donar a un paciente
export function canDonateToPatient(donorType, patientType) {
  return BLOOD_TYPE_COMPATIBILITY[donorType]?.includes(patientType) || false
}

// Obtener descripción de compatibilidad
export function getBloodTypeDescription(bloodType) {
  const descriptions = {
    'O-': 'Donador universal - Puede donar a todos',
    'O+': 'Puede donar a tipos positivos',
    'A-': 'Puede donar a A y AB',
    'A+': 'Puede donar a A+ y AB+',
    'B-': 'Puede donar a B y AB',
    'B+': 'Puede donar a B+ y AB+',
    'AB-': 'Puede donar a AB',
    'AB+': 'Receptor universal - Puede recibir de todos'
  }
  
  return descriptions[bloodType] || ''
}

// Todos los tipos de sangre disponibles
export const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
