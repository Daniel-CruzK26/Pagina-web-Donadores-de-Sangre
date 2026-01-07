import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Phone, Mail, MessageSquare, Copy, Check, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function ResponsesList({ requestId, maxResponses }) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    loadResponses()
    
    // Suscripción en tiempo real
    const channel = supabase
      .channel(`responses-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donor_responses',
          filter: `request_id=eq.${requestId}`
        },
        () => {
          loadResponses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  const loadResponses = async () => {
    try {
      // Primero obtener las respuestas
      const { data: responsesData, error: responsesError } = await supabase
        .from('donor_responses')
        .select('id, donor_id, status, response_message, created_at')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })

      if (responsesError) throw responsesError

      // Luego obtener los perfiles de los donadores
      const donorIds = responsesData.map(r => r.donor_id)
      const { data: donorsData, error: donorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, blood_type')
        .in('id', donorIds)

      if (donorsError) throw donorsError

      // Combinar los datos
      const combinedData = responsesData.map(response => ({
        ...response,
        donor: donorsData.find(d => d.id === response.donor_id)
      }))

      setResponses(combinedData || [])
    } catch (error) {
      console.error('Error al cargar respuestas:', error)
      toast.error('Error al cargar respuestas')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Copiado al portapapeles')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleUpdateStatus = async (responseId, newStatus) => {
    try {
      const { error } = await supabase
        .from('donor_responses')
        .update({ status: newStatus })
        .eq('id', responseId)

      if (error) throw error
      toast.success('Estado actualizado')
      loadResponses()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      interested: { label: 'Interesado', color: '#3b82f6' },
      confirmed: { label: 'Confirmado', color: '#10b981' },
      completed: { label: 'Completado', color: '#8b5cf6' },
      cancelled: { label: 'Cancelado', color: '#6b7280' }
    }

    const config = statusConfig[status] || statusConfig.interested

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: '600',
        background: `${config.color}15`,
        color: config.color
      }}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: 'var(--radius-md)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Donadores Interesados
          </h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            {responses.length} de {maxResponses} respuestas máximas
          </p>
        </div>
        {responses.length >= maxResponses && (
          <span style={{
            padding: '0.5rem 1rem',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            Límite Alcanzado
          </span>
        )}
      </div>

      {/* Lista de respuestas */}
      {responses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#999'
        }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem' }}>Aún no hay respuestas</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Los donadores compatibles recibirán una notificación
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {responses.map((response) => (
            <div
              key={response.id}
              style={{
                padding: '1.5rem',
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Header de donador */}
              <div style={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  {/* Avatar */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {response.donor.full_name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      marginBottom: '0.25rem',
                      color: '#333'
                    }}>
                      {response.donor.full_name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#ffe5e5',
                        color: 'var(--primary-color)',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: '700'
                      }}>
                        {response.donor.blood_type}
                      </span>
                      {getStatusBadge(response.status)}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'right', flexShrink: 0 }}>
                  {formatDistanceToNow(new Date(response.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>

              {/* Información de contacto */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                {/* Teléfono */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: '#f9f9f9',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Phone size={16} color="#666" />
                  <span style={{ fontSize: '0.9rem', flex: 1 }}>{response.donor.phone}</span>
                  <button
                    onClick={() => handleCopy(response.donor.phone, `phone-${response.id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: '#666'
                    }}
                  >
                    {copiedField === `phone-${response.id}` ? (
                      <Check size={16} color="var(--primary-color)" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>

                {/* Email */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: '#f9f9f9',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Mail size={16} color="#666" />
                  <span style={{
                    fontSize: '0.9rem',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {response.donor.email}
                  </span>
                  <button
                    onClick={() => handleCopy(response.donor.email, `email-${response.id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: '#666'
                    }}
                  >
                    {copiedField === `email-${response.id}` ? (
                      <Check size={16} color="var(--primary-color)" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje del donador */}
              {response.response_message && (
                <div style={{
                  padding: '1rem',
                  background: '#f0f9ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MessageSquare size={16} color="#3b82f6" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e40af' }}>
                      Mensaje del donador
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                    {response.response_message}
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${response.donor.phone.replace(/\D/g, '')}?text=Hola ${response.donor.full_name}, te contacto por tu respuesta en la plataforma de donadores de sangre.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#25D366',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <Send size={18} />
                  WhatsApp
                </a>

                {/* Email */}
                <a
                  href={`mailto:${response.donor.email}?subject=Donación de sangre - Solicitud&body=Hola ${response.donor.full_name},%0D%0A%0D%0AMe comunico contigo por tu respuesta en la plataforma.`}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <Mail size={18} />
                  Enviar Email
                </a>

                {/* Botones de estado */}
                {response.status === 'interested' && (
                  <button
                    onClick={() => handleUpdateStatus(response.id, 'confirmed')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Confirmar
                  </button>
                )}

                {response.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(response.id, 'completed')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Completado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
