# 🩸 Plataforma de Donadores de Sangre

Plataforma web altruista que conecta a personas que necesitan donadores de sangre con donadores voluntarios compatibles. Sistema de matching inteligente basado en compatibilidad de tipo de sangre y geolocalización.

## 🎯 Características Principales

### Para Donadores
- ✅ Registro con tipo de sangre y ubicación
- ✅ Dashboard con solicitudes compatibles filtradas automáticamente
- ✅ Visualización de distancia a hospitales
- ✅ Sistema de urgencias con priorización
- ✅ Respuestas rápidas con mensajes personalizados
- ✅ Notificaciones en tiempo real de nuevas solicitudes
- ✅ Historial de donaciones realizadas

### Para Solicitantes
- ✅ Creación de solicitudes con ubicación del hospital en mapa interactivo
- ✅ Límite de 3 solicitudes activas simultáneas
- ✅ Expiración automática después de 14 días
- ✅ Panel para gestionar respuestas de donadores
- ✅ Información de contacto (teléfono, email) de donadores interesados
- ✅ Integración con WhatsApp para contacto rápido
- ✅ Control de estados (activo, completado, cancelado)

### Características Técnicas
- ✅ Autenticación segura con Supabase Auth
- ✅ Base de datos PostgreSQL con Row Level Security (RLS)
- ✅ Geolocalización con Leaflet y OpenStreetMap
- ✅ Cálculo de distancias con fórmula de Haversine
- ✅ Geocodificación inversa con Nominatim API
- ✅ Actualización en tiempo real con Supabase Realtime
- ✅ Sistema de notificaciones por email (próximamente)
- ✅ Responsive design para móviles y desktop

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.0** - Framework UI
- **Vite 5.4.21** - Build tool y dev server
- **React Router 6.21.0** - Enrutamiento
- **Leaflet + react-leaflet** - Mapas interactivos
- **date-fns 3.0.0** - Manejo de fechas
- **react-hot-toast 2.4.1** - Notificaciones toast
- **lucide-react** - Iconos

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Realtime subscriptions
  - Edge Functions (para notificaciones)
  - Row Level Security (RLS)

### APIs Externas
- **Nominatim API** - Geocodificación reversa (sin API key)
- **Resend API** - Servicio de emails (próximamente)

## 📋 Requisitos Previos

- Node.js 16+ y npm
- Cuenta de Supabase (gratis)
- Cuenta de Resend (opcional, para emails)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd Pagina-web-Donadores-de-Sangre
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ir a **Settings** → **API** y copiar:
   - Project URL
   - Anon public key

3. Ejecutar el script SQL de la base de datos:
   - Ir a **SQL Editor**
   - Copiar y ejecutar el contenido completo del archivo `database-schema.sql` (ver abajo)

### 4. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_APP_URL=http://localhost:5173
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📊 Estructura de la Base de Datos

### Tablas Principales

#### profiles
- Información extendida de usuarios
- Campos: full_name, blood_type, phone, role, location

#### donation_requests
- Solicitudes de donación
- Campos: patient info, hospital, urgency, expiration, status
- Trigger automático para expiración

#### donor_responses
- Respuestas de donadores a solicitudes
- Campos: donor_id, request_id, status, message
- Constraint único: un donador solo puede responder una vez

### Políticas de Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado:
- **profiles**: Los usuarios solo pueden ver y editar su propio perfil
- **donation_requests**: Visibles para todos, solo editables por el creador
- **donor_responses**: Los donadores ven sus respuestas, los solicitantes ven respuestas a sus solicitudes

Ver el archivo `database-schema.sql` para el schema completo.

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── DonorResponseModal.jsx    # Modal para responder a solicitudes
│   ├── ResponsesList.jsx         # Lista de donadores que respondieron
│   ├── MapPicker.jsx             # Selector de ubicación en mapa
│   ├── ProtectedRoute.jsx        # Guard para rutas autenticadas
│   ├── Navbar.jsx                # Navegación principal
│   ├── Hero.jsx                  # Hero de landing page
│   ├── InfoSection.jsx           # Sección informativa
│   ├── Locator.jsx               # Localizador de clínicas
│   └── Footer.jsx                # Footer
├── contexts/
│   └── AuthContext.jsx           # Context de autenticación
├── lib/
│   └── supabaseClient.js         # Cliente de Supabase
├── pages/
│   ├── Auth/
│   │   ├── Login.jsx             # Página de login
│   │   └── Signup.jsx            # Página de registro
│   ├── HomePage.jsx              # Landing page
│   ├── ClinicsPage.jsx           # Página de clínicas
│   ├── DonorDashboard.jsx        # Dashboard de donadores
│   └── RequestDashboard.jsx      # Dashboard de solicitantes
├── utils/
│   ├── bloodTypeMatching.js      # Lógica de compatibilidad
│   └── geolocation.js            # Utilidades de geolocalización
├── data/
│   └── clinics.js                # Datos de clínicas
├── App.jsx                       # Router principal
├── main.jsx                      # Entry point
└── index.css                     # Estilos globales
```

## 🔐 Autenticación y Roles

El sistema maneja dos roles de usuario:

1. **donor**: Personas que pueden donar sangre
   - Acceso a `/donar` (DonorDashboard)
   - Pueden ver y responder a solicitudes compatibles

2. **requester**: Personas que necesitan donadores
   - Acceso a `/solicitar` (RequestDashboard)
   - Pueden crear solicitudes y gestionar respuestas

El rol se asigna durante el registro y no puede cambiarse.

## 🧬 Sistema de Compatibilidad de Sangre

Matriz de compatibilidad implementada:

| Donador | Puede donar a |
|---------|---------------|
| O-      | Todos (Universal) |
| O+      | O+, A+, B+, AB+ |
| A-      | A-, A+, AB-, AB+ |
| A+      | A+, AB+ |
| B-      | B-, B+, AB-, AB+ |
| B+      | B+, AB+ |
| AB-     | AB-, AB+ |
| AB+     | AB+ |

## 🗺️ Geolocalización

### Características
- **Selección en mapa**: Selector interactivo con marcador arrastrable
- **Geocodificación inversa**: Convierte coordenadas a dirección legible
- **Cálculo de distancia**: Fórmula de Haversine para distancias precisas
- **Caché local**: Direcciones guardadas en localStorage (30 días)
- **Validación**: Solo permite ubicaciones dentro de México

### APIs Utilizadas
- **OpenStreetMap**: Tiles de mapa (sin API key)
- **Nominatim**: Geocodificación (sin API key, rate limit: 1 req/s)

## 📧 Sistema de Notificaciones (En Desarrollo)

El proyecto incluye documentación completa para implementar Edge Functions con Resend.

Ver archivo `EDGE_FUNCTIONS.md` para:
- Notificación a donadores cuando se crea una solicitud
- Notificación al solicitante cuando recibe una respuesta
- Recordatorios automáticos de expiración (cron job)

## 🎨 Diseño y Estética

- **Color principal**: `#d32f2f` (rojo sangre)
- **Fuente**: System fonts (sans-serif)
- **Responsive**: Mobile-first approach
- **Iconos**: lucide-react
- **Toast notifications**: react-hot-toast con estilo personalizado

## 🚧 Características Pendientes

- [ ] Implementar Edge Functions para notificaciones por email
- [ ] Sistema de calificaciones para donadores
- [ ] Certificados de donación descargables
- [ ] Estadísticas públicas de impacto
- [ ] Integración con SMS (opcional)
- [ ] PWA (Progressive Web App) para instalación móvil
- [ ] Panel de administración

## 🤝 Contribuir

Este es un proyecto altruista y de código abierto. Las contribuciones son bienvenidas:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Autores

Proyecto desarrollado como iniciativa altruista para el Instituto Politécnico Nacional - ESCOM.

## 🆘 Soporte

Para preguntas o problemas:
1. Revisa la documentación existente
2. Verifica la configuración de Supabase
3. Consulta los logs en la consola del navegador
4. Abre un issue en el repositorio

## 🙏 Agradecimientos

- Instituto Politécnico Nacional - ESCOM
- Comunidad de Supabase
- OpenStreetMap contributors
- Nominatim API
- Todos los donadores de sangre voluntarios

---

**Nota**: Este es un proyecto educativo y altruista. No reemplaza los sistemas oficiales de los bancos de sangre. Siempre consulta con profesionales médicos para donaciones de sangre.
