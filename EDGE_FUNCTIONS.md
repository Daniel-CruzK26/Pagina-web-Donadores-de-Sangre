# Supabase Edge Functions - Guía de Implementación

Este documento describe las Edge Functions necesarias para el sistema de notificaciones por email.

## Requisitos Previos

1. **Instalar Supabase CLI:**
```bash
npm install -g supabase
```

2. **Inicializar Supabase en el proyecto:**
```bash
supabase init
```

3. **Obtener Resend API Key:**
   - Registrarse en https://resend.com
   - Crear una API key
   - Verificar un dominio (o usar el dominio de prueba onboarding.resend.dev)

4. **Configurar secretos en Supabase:**
```bash
supabase secrets set RESEND_API_KEY=tu_api_key_aqui
```

## Edge Functions a Crear

### 1. notify-donors

**Propósito:** Notificar a donadores compatibles cuando se crea una nueva solicitud.

**Trigger:** Llamar desde el frontend después de crear una solicitud exitosamente.

**Archivo:** `supabase/functions/notify-donors/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  request_id: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { request_id } = await req.json() as EmailRequest

    // Obtener la solicitud
    const { data: request, error: requestError } = await supabaseClient
      .from('donation_requests')
      .select('*, profiles!requester_id(full_name)')
      .eq('id', request_id)
      .single()

    if (requestError) throw requestError

    // Obtener donadores compatibles
    const compatibilityMap: { [key: string]: string[] } = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+']
    }

    const compatibleTypes = Object.keys(compatibilityMap).filter(type =>
      compatibilityMap[type].includes(request.patient_blood_type)
    )

    // Obtener perfiles de donadores compatibles
    const { data: donors, error: donorsError } = await supabaseClient
      .from('profiles')
      .select('email, full_name, blood_type')
      .in('blood_type', compatibleTypes)
      .eq('role', 'donor')

    if (donorsError) throw donorsError

    // Enviar emails usando Resend
    const emailPromises = donors.map(donor => 
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Donadores de Sangre <onboarding@resend.dev>',
          to: donor.email,
          subject: `🩸 Nueva solicitud urgente de sangre tipo ${request.patient_blood_type}`,
          html: `
            <h2>Hola ${donor.full_name},</h2>
            <p>Hay una nueva solicitud de donación de sangre compatible con tu tipo (${donor.blood_type}):</p>
            <ul>
              <li><strong>Paciente:</strong> ${request.patient_name}</li>
              <li><strong>Tipo de sangre:</strong> ${request.patient_blood_type}</li>
              <li><strong>Hospital:</strong> ${request.hospital_name}</li>
              <li><strong>Urgencia:</strong> ${request.urgency}</li>
              <li><strong>Unidades necesarias:</strong> ${request.units_needed}</li>
            </ul>
            <p><a href="${Deno.env.get('APP_URL')}/donar" style="background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Ver Solicitud</a></p>
            <p>Gracias por ser parte de esta comunidad solidaria.</p>
          `
        })
      })
    )

    await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({ success: true, notified: donors.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### 2. notify-requester

**Propósito:** Notificar al solicitante cuando un donador responde a su solicitud.

**Trigger:** Llamar desde el frontend después de que un donador envía su respuesta.

**Archivo:** `supabase/functions/notify-requester/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  response_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { response_id } = await req.json() as EmailRequest

    // Obtener la respuesta con información del donador y la solicitud
    const { data: response, error: responseError } = await supabaseClient
      .from('donor_responses')
      .select(`
        *,
        donor:profiles!donor_responses_donor_id_fkey(full_name, email, phone, blood_type),
        request:donation_requests!donor_responses_request_id_fkey(
          *,
          requester:profiles!donation_requests_requester_id_fkey(full_name, email)
        )
      `)
      .eq('id', response_id)
      .single()

    if (responseError) throw responseError

    // Enviar email al solicitante
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Donadores de Sangre <onboarding@resend.dev>',
        to: response.request.requester.email,
        subject: `🎉 ¡Nuevo donador para ${response.request.patient_name}!`,
        html: `
          <h2>¡Buenas noticias, ${response.request.requester.full_name}!</h2>
          <p>Un donador ha respondido a tu solicitud de sangre:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Información del Donador</h3>
            <ul>
              <li><strong>Nombre:</strong> ${response.donor.full_name}</li>
              <li><strong>Tipo de sangre:</strong> ${response.donor.blood_type}</li>
              <li><strong>Teléfono:</strong> ${response.donor.phone}</li>
              <li><strong>Email:</strong> ${response.donor.email}</li>
            </ul>
            ${response.response_message ? `<p><strong>Mensaje:</strong> "${response.response_message}"</p>` : ''}
          </div>
          <p><strong>Detalles de tu solicitud:</strong></p>
          <ul>
            <li>Paciente: ${response.request.patient_name}</li>
            <li>Hospital: ${response.request.hospital_name}</li>
            <li>Tipo de sangre: ${response.request.patient_blood_type}</li>
          </ul>
          <p><a href="${Deno.env.get('APP_URL')}/solicitar" style="background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Ver Todas las Respuestas</a></p>
          <p><strong>Próximos pasos:</strong></p>
          <ol>
            <li>Contacta al donador para coordinar la cita</li>
            <li>Confirma la fecha y hora en el hospital</li>
            <li>Recuerda que se verificará el tipo de sangre en el hospital</li>
          </ol>
        `
      })
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### 3. check-expiring-requests

**Propósito:** Función programada (cron job) que envía recordatorios de solicitudes próximas a expirar.

**Trigger:** Ejecutar automáticamente cada 12 horas.

**Archivo:** `supabase/functions/check-expiring-requests/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener solicitudes que expiran en las próximas 24 horas
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)
    
    const now = new Date()

    const { data: requests, error } = await supabaseClient
      .from('donation_requests')
      .select('*, profiles!requester_id(full_name, email)')
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .lt('expires_at', tomorrow.toISOString())

    if (error) throw error

    // Enviar emails de recordatorio
    const emailPromises = requests.map(request =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Donadores de Sangre <onboarding@resend.dev>',
          to: request.profiles.email,
          subject: `⏰ Tu solicitud de donación expira pronto`,
          html: `
            <h2>Hola ${request.profiles.full_name},</h2>
            <p>Tu solicitud de donación de sangre para <strong>${request.patient_name}</strong> expirará en menos de 24 horas.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li>Tipo de sangre: ${request.patient_blood_type}</li>
              <li>Hospital: ${request.hospital_name}</li>
              <li>Expira el: ${new Date(request.expires_at).toLocaleString('es-MX')}</li>
            </ul>
            <p>Si aún necesitas donadores, puedes:</p>
            <ul>
              <li>Revisar las respuestas que has recibido</li>
              <li>Crear una nueva solicitud si es necesario</li>
              <li>Marcar la solicitud como completada si ya obtuviste ayuda</li>
            </ul>
            <p><a href="${Deno.env.get('APP_URL')}/solicitar" style="background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Ir a Mis Solicitudes</a></p>
          `
        })
      })
    )

    await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({ success: true, notified: requests.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

## Despliegue de las Funciones

### 1. Crear las funciones localmente:

```bash
# Crear estructura de carpetas
supabase functions new notify-donors
supabase functions new notify-requester
supabase functions new check-expiring-requests
```

### 2. Copiar el código de cada función en su respectivo archivo `index.ts`

### 3. Desplegar a Supabase:

```bash
# Deploy individual
supabase functions deploy notify-donors
supabase functions deploy notify-requester
supabase functions deploy check-expiring-requests

# O todas a la vez
supabase functions deploy
```

### 4. Configurar Cron Job para check-expiring-requests:

En el dashboard de Supabase:
1. Ir a **Database** → **Cron Jobs**
2. Crear nuevo cron job:
   - Name: `check-expiring-requests`
   - Schedule: `0 */12 * * *` (cada 12 horas)
   - Command: `SELECT net.http_post('https://[TU-PROJECT-REF].supabase.co/functions/v1/check-expiring-requests', '{}'::jsonb, '{"Authorization": "Bearer [ANON-KEY]"}'::jsonb);`

## Configuración Adicional

### Variables de Entorno

Agregar al `.env`:
```env
VITE_APP_URL=http://localhost:5173  # Cambiar a tu dominio en producción
```

### Modificar el código frontend

En `src/pages/RequestDashboard.jsx`, después de crear una solicitud exitosamente:

```javascript
// Después del insert exitoso
await supabase.functions.invoke('notify-donors', {
  body: { request_id: data[0].id }
})
```

En `src/components/DonorResponseModal.jsx`, después de insertar la respuesta:

```javascript
// Después del insert exitoso
await supabase.functions.invoke('notify-requester', {
  body: { response_id: data[0].id }
})
```

## Testing Local

Para probar las funciones localmente:

```bash
# Iniciar Supabase local
supabase start

# Servir las funciones
supabase functions serve

# Invocar una función
curl -i --location --request POST 'http://localhost:54321/functions/v1/notify-donors' \
  --header 'Authorization: Bearer [ANON-KEY]' \
  --header 'Content-Type: application/json' \
  --data '{"request_id": "uuid-here"}'
```

## Notas Importantes

1. **Dominio verificado:** Para producción, debes verificar un dominio en Resend y cambiar el `from` address.

2. **Rate Limits:** Resend tiene límites de envío. Para producción considera agrupar emails o implementar cola de envío.

3. **Error Handling:** Las funciones incluyen manejo básico de errores. Considera agregar logging más robusto.

4. **Seguridad:** Las funciones usan el anon key del header para autenticación. Asegúrate de que RLS esté configurado correctamente.

5. **Monitoring:** Revisa los logs en Supabase Dashboard → Edge Functions → Logs.

## Próximos Pasos

1. Crear las funciones en Supabase
2. Configurar Resend API key
3. Descomentar las invocaciones en el frontend
4. Probar el flujo completo de notificaciones
5. Configurar el cron job para recordatorios

