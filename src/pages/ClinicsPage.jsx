import Locator from '../components/Locator'

export function ClinicsPage() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="container">
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'var(--primary-color)',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          Clínicas de Donación
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '3rem',
          fontSize: '1.1rem'
        }}>
          Encuentra la clínica de donación de sangre más cercana a ti
        </p>
        <Locator />
      </div>
    </div>
  )
}
