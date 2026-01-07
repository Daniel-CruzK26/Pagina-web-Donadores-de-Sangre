import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { X, MapPin, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function DonorResponseModal({ request, onClose, onSuccess }) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Insertar respuesta
      const { data, error } = await supabase
        .from('donor_responses')
        .insert({
          request_id: request.id,
          donor_id: profile.id,
          status: 'interested',
          response_message: message || null
        })
        .select()

      if (error) throw error

      toast.success('¡Respuesta enviada! El solicitante recibirá tu información.')
      
      // Llamar Edge Function para notificar (comentado hasta crear la función)
      // await supabase.functions.invoke('notify-requester', {
      //   body: { response_id: data[0].id }
      // })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error al responder:', error)
      if (error.code === '23505') {
        toast.error('Ya has respondido a esta solicitud')
      } else {
        toast.error(error.message || 'Error al enviar respuesta')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--primary-color)'
          }}>
            Confirmar Respuesta
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#666'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Resumen de solicitud */}
          <div style={{
            padding: '1.5rem',
            background: '#f9f9f9',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#333'
            }}>
              Resumen de la solicitud
            </h3>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>Paciente</p>
              <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{request.patient_name}</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Tipo de sangre</p>
                <p style={{
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  color: 'var(--primary-color)'
                }}>
                  {request.patient_blood_type}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Unidades</p>
                <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{request.units_needed}</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'start',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'white',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1rem'
            }}>
              <MapPin size={18} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {request.hospital_name}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {request.hospital_address}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Mensaje personalizado (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej: Puedo asistir el día de mañana por la tarde..."
                maxLength={500}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {message.length}/500 caracteres
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{
              padding: '1rem',
              background: '#fff7ed',
              border: '2px solid #fed7aa',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <AlertTriangle size={20} color="#f97316" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <div>
                  <p style={{ fontWeight: '600', color: '#9a3412', marginBottom: '0.5rem' }}>
                    Aviso Importante
                  </p>
                  <ul style={{
                    fontSize: '0.85rem',
                    color: '#7c2d12',
                    paddingLeft: '1.25rem',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    <li>Tu tipo de sangre será verificado en el hospital</li>
                    <li>El solicitante recibirá tu nombre, teléfono y email</li>
                    <li>Esta plataforma solo facilita el contacto</li>
                    <li>No está permitida compensación económica</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Enviando...' : 'Confirmar Respuesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
