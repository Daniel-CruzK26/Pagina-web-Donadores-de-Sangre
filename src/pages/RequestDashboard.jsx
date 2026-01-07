import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { BLOOD_TYPES } from '../utils/bloodTypeMatching'
import { MapPicker } from '../components/MapPicker'
import { HospitalAutocomplete } from '../components/HospitalAutocomplete'
import { ResponsesList } from '../components/ResponsesList'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, AlertCircle, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const urgencyConfig = {
  urgent: { label: 'Urgente', color: '#ef4444', bgColor: '#fee2e2' },
  high: { label: 'Alta', color: '#f97316', bgColor: '#ffedd5' },
  medium: { label: 'Media', color: '#eab308', bgColor: '#fef9c3' },
  low: { label: 'Baja', color: '#22c55e', bgColor: '#dcfce7' }
}

export function RequestDashboard() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('create')
  const [myRequests, setMyRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [canCreateMore, setCanCreateMore] = useState(true)
  const [activeRequestsCount, setActiveRequestsCount] = useState(0)
  const [selectedRequestForResponses, setSelectedRequestForResponses] = useState(null)
  const [mapPosition, setMapPosition] = useState(null)
  const [useManualLocation, setUseManualLocation] = useState(false)

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_blood_type: '',
    units_needed: 1,
    hospital_name: '',
    hospital_address: '',
    hospital_city: 'Ciudad de México',
    hospital_state: 'CDMX',
    hospital_lat: null,
    hospital_lng: null,
    contact_phone: profile?.phone?.replace('+52', '') || '',
    medical_condition: '',
    additional_notes: '',
    urgency: 'medium',
    max_responses: 5
  })

  useEffect(() => {
    if (profile) {
      loadMyRequests()
    }
  }, [profile])

  const loadMyRequests = async () => {
    try {
      setLoading(true)
      
      // Obtener solicitudes
      const { data: requests, error: requestsError } = await supabase
        .from('donation_requests')
        .select('*')
        .eq('requester_id', profile.id)
        .order('created_at', { descending: true })

      if (requestsError) throw requestsError

      // Obtener conteos de respuestas para cada solicitud
      const requestsWithCount = await Promise.all(
        (requests || []).map(async (request) => {
          const { count, error: countError } = await supabase
            .from('donor_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', request.id)

          return {
            ...request,
            response_count: countError ? 0 : (count || 0)
          }
        })
      )

      setMyRequests(requestsWithCount)
      
      const activeCount = requestsWithCount.filter(r => r.status === 'active').length
      setActiveRequestsCount(activeCount)
      setCanCreateMore(activeCount < 3)
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
      toast.error('Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLocationSelect = (lat, lng, address, addressData) => {
    setFormData(prev => ({
      ...prev,
      hospital_lat: lat,
      hospital_lng: lng,
      hospital_address: address,
      hospital_city: addressData.city,
      hospital_state: addressData.state,
      // Si está en modo manual y no hay nombre, usar la dirección
      hospital_name: useManualLocation && !prev.hospital_name 
        ? `Hospital en ${addressData.city}` 
        : prev.hospital_name
    }))
  }

  const handlePlaceSelect = (place) => {
    setFormData(prev => ({
      ...prev,
      hospital_name: place.name.split(',')[0], // Usar solo el primer nombre
      hospital_lat: place.lat,
      hospital_lng: place.lng,
      hospital_address: place.name,
      hospital_city: place.address.city,
      hospital_state: place.address.state
    }))
    setMapPosition([place.lat, place.lng])
    setUseManualLocation(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!formData.hospital_lat || !formData.hospital_lng) {
      toast.error('Por favor selecciona la ubicación del hospital en el mapa')
      return
    }

    if (!canCreateMore) {
      toast.error('Has alcanzado el límite de 3 solicitudes activas')
      return
    }

    if (formData.contact_phone && !/^\d{10}$/.test(formData.contact_phone)) {
      toast.error('El teléfono debe tener 10 dígitos')
      return
    }

    setLoading(true)

    try {
      const phoneWithPrefix = `+52${formData.contact_phone}`
      
      // Calcular fecha de expiración: ahora + 14 días
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14)

      const { data, error } = await supabase
        .from('donation_requests')
        .insert({
          requester_id: profile.id,
          patient_name: formData.patient_name,
          patient_blood_type: formData.patient_blood_type,
          units_needed: parseInt(formData.units_needed),
          hospital_name: formData.hospital_name,
          hospital_address: formData.hospital_address,
          hospital_city: formData.hospital_city,
          hospital_state: formData.hospital_state,
          hospital_lat: formData.hospital_lat,
          hospital_lng: formData.hospital_lng,
          contact_phone: phoneWithPrefix,
          medical_condition: formData.medical_condition || null,
          additional_notes: formData.additional_notes || null,
          urgency: formData.urgency,
          max_responses: parseInt(formData.max_responses),
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
        .select()

      if (error) throw error

      toast.success('Solicitud creada exitosamente')
      
      // Resetear formulario
      setFormData({
        patient_name: '',
        patient_blood_type: '',
        units_needed: 1,
        hospital_name: '',
        hospital_address: '',
        hospital_city: 'Ciudad de México',
        hospital_state: 'CDMX',
        hospital_lat: null,
        hospital_lng: null,
        contact_phone: profile?.phone?.replace('+52', '') || '',
        medical_condition: '',
        additional_notes: '',
        urgency: 'medium',
        max_responses: 5
      })

      setMapPosition(null)
      setUseManualLocation(false)

      // Recargar solicitudes y cambiar a tab activas
      await loadMyRequests()
      setActiveTab('active')

      // Llamar Edge Function para notificar donadores (comentado hasta crear la función)
      // await supabase.functions.invoke('notify-donors', {
      //   body: { request_id: data[0].id }
      // })
    } catch (error) {
      console.error('Error al crear solicitud:', error)
      toast.error(error.message || 'Error al crear solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('donation_requests')
        .update({ status: newStatus })
        .eq('id', requestId)

      if (error) throw error

      toast.success(`Solicitud marcada como ${newStatus === 'fulfilled' ? 'completada' : 'cancelada'}`)
      loadMyRequests()
    } catch (error) {
      console.error('Error al actualizar:', error)
      toast.error('Error al actualizar solicitud')
    }
  }

  const renderCreateForm = () => (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-md)',
      padding: '2rem',
      boxShadow: 'var(--shadow-md)'
    }}>
      {!canCreateMore && (
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'start'
        }}>
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
          <div>
            <p style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.25rem' }}>
              Límite alcanzado
            </p>
            <p style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>
              Tienes {activeRequestsCount} solicitudes activas. Debes completar o cancelar alguna antes de crear una nueva.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nombre del paciente *
            </label>
            <input
              type="text"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleChange}
              required
              disabled={!canCreateMore}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem'
              }}
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Tipo de sangre requerido *
            </label>
            <select
              name="patient_blood_type"
              value={formData.patient_blood_type}
              onChange={handleChange}
              required
              disabled={!canCreateMore}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                cursor: canCreateMore ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="">Seleccionar tipo</option>
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Unidades necesarias *
            </label>
            <input
              type="number"
              name="units_needed"
              value={formData.units_needed}
              onChange={handleChange}
              required
              min="1"
              max="10"
              disabled={!canCreateMore}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nivel de urgencia *
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              required
              disabled={!canCreateMore}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                cursor: canCreateMore ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="urgent">Urgente (24h)</option>
              <option value="high">Alta (48h)</option>
              <option value="medium">Media (1 semana)</option>
              <option value="low">Baja (Flexible)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Nombre del hospital *
          </label>
          <HospitalAutocomplete
            value={formData.hospital_name}
            onChange={(value) => setFormData(prev => ({ ...prev, hospital_name: value }))}
            onPlaceSelect={handlePlaceSelect}
            disabled={!canCreateMore || useManualLocation}
          />
          {!useManualLocation && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              💡 Escribe el nombre del hospital y selecciona de las sugerencias, o{' '}
              <button
                type="button"
                onClick={() => setUseManualLocation(true)}
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
                usa el mapa manualmente
              </button>
            </p>
          )}
          {useManualLocation && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              📍 Modo manual activado.{' '}
              <button
                type="button"
                onClick={() => setUseManualLocation(false)}
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
                Volver a búsqueda automática
              </button>
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>
            Ubicación del hospital * 📍
          </label>
          {canCreateMore && (
            <MapPicker
              onLocationSelect={handleLocationSelect}
              initialPosition={mapPosition || (formData.hospital_lat && formData.hospital_lng ? [formData.hospital_lat, formData.hospital_lng] : null)}
            />
          )}
          {formData.hospital_address && (
            <p style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: '#f0f9ff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              color: '#0369a1'
            }}>
              ✓ Dirección seleccionada: {formData.hospital_address}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Teléfono de contacto *
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{
              padding: '0.75rem',
              background: '#f5f5f5',
              border: '2px solid #e0e0e0',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '600',
              color: '#666'
            }}>
              +52
            </div>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              maxLength={10}
              disabled={!canCreateMore}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem'
              }}
              placeholder="5512345678"
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Condición médica (opcional)
            </label>
            <textarea
              name="medical_condition"
              value={formData.medical_condition}
              onChange={handleChange}
              disabled={!canCreateMore}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                resize: 'vertical'
              }}
              placeholder="Ej: Cirugía programada, anemia severa..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Notas adicionales (opcional)
            </label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              disabled={!canCreateMore}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                resize: 'vertical'
              }}
              placeholder="Información adicional relevante..."
            />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Máximo de respuestas a recibir
          </label>
          <select
            name="max_responses"
            value={formData.max_responses}
            onChange={handleChange}
            disabled={!canCreateMore}
            style={{
              width: '200px',
              padding: '0.75rem',
              border: '2px solid #e0e0e0',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              cursor: canCreateMore ? 'pointer' : 'not-allowed'
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num} donador{num > 1 ? 'es' : ''}</option>
            ))}
          </select>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            Número de donadores que pueden responder a tu solicitud
          </p>
        </div>

        <div style={{
          padding: '1.5rem',
          background: '#fff7ed',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          border: '1px solid #fed7aa'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#9a3412' }}>
            ⚠️ Aviso importante
          </p>
          <ul style={{ fontSize: '0.9rem', color: '#7c2d12', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Esta plataforma solo facilita el contacto entre donadores y pacientes</li>
            <li>La verificación del tipo de sangre se realiza en el hospital</li>
            <li>Tu solicitud expirará automáticamente en 14 días</li>
            <li>Los donadores recibirán una notificación con tu información de contacto</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading || !canCreateMore}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            opacity: loading || !canCreateMore ? 0.5 : 1,
            cursor: loading || !canCreateMore ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creando solicitud...' : 'Crear Solicitud'}
        </button>
      </form>
    </div>
  )

  const renderRequestsList = (filterStatus) => {
    const filteredRequests = myRequests.filter(r => {
      if (filterStatus === 'active') return r.status === 'active'
      return ['fulfilled', 'cancelled', 'expired'].includes(r.status)
    })

    if (filteredRequests.length === 0) {
      return (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            No tienes solicitudes {filterStatus === 'active' ? 'activas' : 'en el historial'}
          </p>
        </div>
      )
    }

    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {filteredRequests.map(request => (
          <div
            key={request.id}
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-md)',
              border: `2px solid ${urgencyConfig[request.urgency]?.color || '#e0e0e0'}`
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {request.patient_name}
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: urgencyConfig[request.urgency].color,
                    backgroundColor: urgencyConfig[request.urgency].bgColor
                  }}>
                    {urgencyConfig[request.urgency].label}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#ffebee',
                    color: '#d32f2f',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {request.patient_blood_type}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  Expira {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true, locale: es })}
                </p>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333', marginTop: '0.25rem' }}>
                  Status: <span style={{
                    color: request.status === 'active' ? '#22c55e' : '#666'
                  }}>{request.status}</span>
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
              padding: '1rem',
              background: '#f9f9f9',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Hospital</p>
                <p style={{ fontWeight: '600' }}>{request.hospital_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Unidades</p>
                <p style={{ fontWeight: '600' }}>{request.units_needed}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Respuestas</p>
                <p style={{ fontWeight: '600' }}>
                  {request.response_count}/{request.max_responses}
                </p>
              </div>
            </div>

            {filterStatus === 'active' && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedRequestForResponses(request)}
                  className="btn"
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '0.75rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Users size={18} />
                  Ver Respuestas ({request.response_count})
                </button>
                <button
                  onClick={() => handleUpdateStatus(request.id, 'fulfilled')}
                  className="btn"
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '0.75rem',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Marcar Completada
                </button>
                <button
                  onClick={() => handleUpdateStatus(request.id, 'cancelled')}
                  className="btn"
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '0.75rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading && myRequests.length === 0) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#666' }}>Cargando...</p>
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
          Solicitar Donadores
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Crea una solicitud para encontrar donadores compatibles ({activeRequestsCount}/3 activas)
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e0e0e0',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'create' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'create' ? 'var(--primary-color)' : '#666',
              fontWeight: activeTab === 'create' ? '600' : '400',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Crear Nueva
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'active' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'active' ? 'var(--primary-color)' : '#666',
              fontWeight: activeTab === 'active' ? '600' : '400',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Activas ({myRequests.filter(r => r.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'history' ? 'var(--primary-color)' : '#666',
              fontWeight: activeTab === 'history' ? '600' : '400',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Historial ({myRequests.filter(r => ['fulfilled', 'cancelled', 'expired'].includes(r.status)).length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'create' && renderCreateForm()}
        {activeTab === 'active' && renderRequestsList('active')}
        {activeTab === 'history' && renderRequestsList('history')}
      </div>

      {/* Modal de respuestas */}
      {selectedRequestForResponses && (
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
          onClick={() => setSelectedRequestForResponses(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-lg)',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--primary-color)'
              }}>
                Respuestas para {selectedRequestForResponses.patient_name}
              </h2>
              <button
                onClick={() => setSelectedRequestForResponses(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#666',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            <ResponsesList
              requestId={selectedRequestForResponses.id}
              maxResponses={selectedRequestForResponses.max_responses}
            />
          </div>
        </div>
      )}
    </div>
  )
}
