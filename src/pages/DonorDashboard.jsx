import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { getCompatibleDonors } from '../utils/bloodTypeMatching'
import { calculateDistance, formatDistance } from '../utils/geolocation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Heart, MapPin, Clock, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { DonorResponseModal } from '../components/DonorResponseModal'

const urgencyConfig = {
  urgent: { label: 'Urgente', color: '#ef4444', bgColor: '#fee2e2' },
  high: { label: 'Alta', color: '#f97316', bgColor: '#ffedd5' },
  medium: { label: 'Media', color: '#eab308', bgColor: '#fef9c3' },
  low: { label: 'Baja', color: '#22c55e', bgColor: '#dcfce7' }
}

export function DonorDashboard() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [myResponses, setMyResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [stats, setStats] = useState({
    compatible: 0,
    responded: 0,
    completed: 0
  })

  useEffect(() => {
    if (profile) {
      loadRequests()
      loadMyResponses()
      subscribeToRequests()
    }
  }, [profile])

  const loadRequests = async () => {
    try {
      setLoading(true)

      // Obtener todas las solicitudes activas
      const { data, error } = await supabase
        .from('donation_requests')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('urgency', { ascending: false })
        .order('created_at', { descending: true })

      if (error) throw error

      // Filtrar por compatibilidad de sangre
      const compatibleTypes = getCompatibleDonors(profile.blood_type)
      let filteredRequests = data.filter(req =>
        compatibleTypes.includes(profile.blood_type)
      )

      // Calcular distancia si el usuario tiene ubicación
      if (profile.location_lat && profile.location_lng) {
        filteredRequests = filteredRequests.map(req => ({
          ...req,
          distance: calculateDistance(
            profile.location_lat,
            profile.location_lng,
            req.hospital_lat,
            req.hospital_lng
          )
        }))

        // Ordenar por urgencia y luego por distancia
        filteredRequests.sort((a, b) => {
          const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
          if (urgencyDiff !== 0) return urgencyDiff
          return a.distance - b.distance
        })
      }

      // Obtener conteos de respuestas
      const requestsWithCounts = await Promise.all(
        filteredRequests.map(async (req) => {
          const { count } = await supabase
            .from('donor_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', req.id)

          return { ...req, response_count: count || 0 }
        })
      )

      setRequests(requestsWithCounts)
      setStats(prev => ({ ...prev, compatible: requestsWithCounts.length }))
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
      toast.error('Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const loadMyResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('donor_responses')
        .select('*, donation_requests(*)')
        .eq('donor_id', profile.id)

      if (error) throw error

      setMyResponses(data || [])
      setStats(prev => ({
        ...prev,
        responded: data?.length || 0,
        completed: data?.filter(r => r.status === 'completed').length || 0
      }))
    } catch (error) {
      console.error('Error al cargar mis respuestas:', error)
    }
  }

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('new-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_requests',
          filter: `status=eq.active`
        },
        (payload) => {
          // Verificar compatibilidad
          const compatibleTypes = getCompatibleDonors(payload.new.patient_blood_type)
          if (compatibleTypes.includes(profile.blood_type)) {
            toast.success('Nueva solicitud compatible disponible')
            loadRequests()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const hasResponded = (requestId) => {
    return myResponses.some(r => r.request_id === requestId)
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#666' }}>Cargando solicitudes...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="container">
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'var(--primary-color)',
          marginBottom: '1rem'
        }}>
          Dashboard de Donador
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Encuentra solicitudes compatibles con tu tipo de sangre ({profile?.blood_type})
        </p>

        {/* Estadísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <Heart size={32} color="#d32f2f" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#d32f2f' }}>
              {stats.compatible}
            </h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Solicitudes Compatibles</p>
          </div>
          
          <div style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <Activity size={32} color="#f97316" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#f97316' }}>
              {stats.responded}
            </h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Mis Respuestas</p>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <Clock size={32} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e' }}>
              {stats.completed}
            </h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Donaciones Completadas</p>
          </div>
        </div>

        {/* Lista de solicitudes */}
        {requests.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              No hay solicitudes activas compatibles con tu tipo de sangre en este momento.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {requests.map(request => (
              <div
                key={request.id}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  border: `2px solid ${urgencyConfig[request.urgency].color}`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
              >
                {/* Urgency badge */}
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: urgencyConfig[request.urgency].color,
                  backgroundColor: urgencyConfig[request.urgency].bgColor,
                  marginBottom: '1rem'
                }}>
                  {urgencyConfig[request.urgency].label}
                </div>

                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '0.5rem'
                }}>
                  {request.patient_name}
                </h3>

                <div style={{ marginBottom: '1rem', color: '#666' }}>
                  <p style={{ marginBottom: '0.25rem' }}>
                    <strong>Tipo de sangre:</strong>{' '}
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#ffebee',
                      color: '#d32f2f',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600'
                    }}>
                      {request.patient_blood_type}
                    </span>
                  </p>
                  <p style={{ marginBottom: '0.25rem' }}>
                    <strong>Unidades:</strong> {request.units_needed}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  <MapPin size={16} style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: '600', color: '#333' }}>{request.hospital_name}</p>
                    <p>{request.hospital_address}</p>
                    {request.distance && (
                      <p style={{ color: '#d32f2f', fontWeight: '600', marginTop: '0.25rem' }}>
                        📍 {formatDistance(request.distance)}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '0.75rem',
                  background: '#f9f9f9',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#666'
                }}>
                  <p>
                    <strong>Expira:</strong>{' '}
                    {formatDistanceToNow(new Date(request.expires_at), {
                      addSuffix: true,
                      locale: es
                    })}
                  </p>
                  <p style={{ marginTop: '0.25rem' }}>
                    <strong>Respuestas:</strong> {request.response_count}/{request.max_responses}
                  </p>
                </div>

                <button
                  disabled={
                    hasResponded(request.id) ||
                    request.response_count >= request.max_responses
                  }
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    opacity: hasResponded(request.id) || request.response_count >= request.max_responses ? 0.5 : 1,
                    cursor: hasResponded(request.id) || request.response_count >= request.max_responses ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => setSelectedRequest(request)}
                >
                  {hasResponded(request.id)
                    ? 'Ya respondiste'
                    : request.response_count >= request.max_responses
                    ? 'Solicitud llena'
                    : 'Puedo Ayudar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de respuesta */}
      {selectedRequest && (
        <DonorResponseModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            loadRequests()
            loadMyResponses()
          }}
        />
      )}
    </div>
  )
}
