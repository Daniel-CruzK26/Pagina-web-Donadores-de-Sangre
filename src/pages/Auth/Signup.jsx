import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BLOOD_TYPES } from '../../utils/bloodTypeMatching'
import toast from 'react-hot-toast'

export function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    blood_type: '',
    terms_accepted: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!formData.blood_type) {
      toast.error('Por favor selecciona tu tipo de sangre')
      return
    }

    if (!formData.terms_accepted) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }

    // Validar teléfono (10 dígitos)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error('El teléfono debe tener 10 dígitos')
      return
    }

    setLoading(true)

    try {
      const phoneWithPrefix = formData.phone ? `+52${formData.phone}` : null

      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: phoneWithPrefix,
        blood_type: formData.blood_type
      })

      if (error) throw error

      toast.success('¡Cuenta creada exitosamente!')
      navigate('/')
    } catch (error) {
      console.error('Error al registrarse:', error)
      toast.error(error.message || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #d32f2f 0%, #ffebee 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '550px',
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: 'var(--border-radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--primary-color)',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Crear Cuenta
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '2rem'
        }}>
          Únete a la comunidad de donadores
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="full_name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Nombre completo *
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="Juan Pérez"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Correo electrónico *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="phone"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Teléfono móvil *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid #e0e0e0',
                backgroundColor: '#f5f5f5',
                fontWeight: '600',
                color: '#666'
              }}>
                +52
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                placeholder="5512345678"
                maxLength={10}
              />
            </div>
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              10 dígitos sin espacios ni guiones
            </small>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="blood_type"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Tipo de sangre * 🩸
            </label>
            <select
              id="blood_type"
              name="blood_type"
              value={formData.blood_type}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            >
              <option value="">Selecciona tu tipo de sangre</option>
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}
            >
              Confirmar contraseña *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder="Repite tu contraseña"
            />
          </div>

          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#ffebee',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid #ffcdd2'
          }}>
            <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="terms_accepted"
                checked={formData.terms_accepted}
                onChange={handleChange}
                required
                style={{ marginRight: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#333', lineHeight: '1.5' }}>
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  términos y condiciones
                </button>
              </span>
            </label>

            {showTerms && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                color: '#666',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <p><strong>Términos y Condiciones:</strong></p>
                <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                  <li>Esta plataforma solo facilita el contacto entre donadores y pacientes</li>
                  <li>No somos un servicio médico ni hospital</li>
                  <li>El tipo de sangre es auto-reportado y debe ser verificado en el hospital</li>
                  <li>No está permitido ningún tipo de compensación económica por donar sangre</li>
                  <li>Tus datos de contacto solo se compartirán cuando respondas a una solicitud</li>
                  <li>Debes cumplir con los requisitos de donación establecidos por el hospital</li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: '#666'
        }}>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Inicia sesión aquí
          </Link>
        </p>

        <Link
          to="/"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '1rem',
            color: '#666',
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
