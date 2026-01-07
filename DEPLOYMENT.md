# 🚀 Guía de Deployment - Plataforma de Donadores de Sangre

Esta guía te ayudará a desplegar la aplicación a producción.

## 📋 Pre-requisitos

- Cuenta de Vercel o Netlify (gratis)
- Proyecto de Supabase configurado
- (Opcional) Dominio personalizado
- (Opcional) Cuenta de Resend para emails

## 🎯 Opciones de Deployment

### Opción 1: Vercel (Recomendado)

Vercel es la opción recomendada por su integración perfecta con Vite y despliegue automático desde Git.

#### Paso 1: Preparar el repositorio

```bash
# Inicializar git si no lo has hecho
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit"

# Crear repositorio en GitHub y pushear
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

#### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) y haz login con GitHub
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Vite

#### Paso 3: Configurar Variables de Entorno

En la configuración del proyecto en Vercel, agrega:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_APP_URL=https://tu-dominio.vercel.app
```

#### Paso 4: Deploy

1. Click en "Deploy"
2. Espera a que termine el build (2-3 minutos)
3. Tu app estará en `https://tu-proyecto.vercel.app`

#### Paso 5: Configurar dominio personalizado (Opcional)

1. En Vercel, ve a Settings → Domains
2. Agrega tu dominio
3. Configura los DNS según las instrucciones
4. Actualiza `VITE_APP_URL` en variables de entorno

### Opción 2: Netlify

#### Paso 1: Build local

```bash
npm run build
```

Esto creará la carpeta `dist/` con los archivos estáticos.

#### Paso 2: Configurar Netlify

Crear archivo `netlify.toml` en la raíz:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### Paso 3: Deploy

**Opción A: Desde GitHub**
1. Push tu código a GitHub
2. En [netlify.com](https://netlify.com), importa el repositorio
3. Configura las variables de entorno
4. Deploy automático

**Opción B: Deploy manual**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Opción 3: Servidor VPS (Avanzado)

Para un VPS con Ubuntu/Debian:

```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar nginx
sudo apt-get install nginx

# 3. Clonar repositorio
cd /var/www
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo

# 4. Instalar dependencias
npm install

# 5. Build
npm run build

# 6. Configurar nginx
sudo nano /etc/nginx/sites-available/donadores
```

Configuración nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/tu-repo/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/donadores /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Instalar SSL con Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## 🔧 Configuración Post-Deployment

### 1. Actualizar URL de la App en Supabase

1. Ve a tu proyecto en Supabase
2. Settings → API → Authentication
3. En "Site URL", agrega tu dominio de producción
4. En "Redirect URLs", agrega:
   - `https://tu-dominio.com/`
   - `https://tu-dominio.com/login`
   - `https://tu-dominio.com/signup`

### 2. Actualizar CORS en Supabase

En Settings → API → CORS:
- Agregar tu dominio de producción a la whitelist

### 3. Configurar Email Templates en Supabase

1. Ve a Authentication → Email Templates
2. Personaliza los templates de:
   - Confirmación de email (si decides habilitarla)
   - Reset de contraseña
   - Cambio de email

### 4. Desplegar Edge Functions (Opcional)

Si implementaste las Edge Functions para notificaciones:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref tu-project-ref

# Deploy functions
supabase functions deploy notify-donors
supabase functions deploy notify-requester
supabase functions deploy check-expiring-requests

# Configurar secretos
supabase secrets set RESEND_API_KEY=tu-api-key
```

### 5. Configurar Cron Job (Si usas Edge Function de recordatorios)

En Supabase:
1. Ve a Database → Cron Jobs
2. Create new job:
   ```sql
   SELECT
     cron.schedule(
       'check-expiring-requests',
       '0 */12 * * *', -- Cada 12 horas
       $$
       SELECT net.http_post(
         url := 'https://tu-project-ref.supabase.co/functions/v1/check-expiring-requests',
         headers := '{"Authorization": "Bearer tu-anon-key"}'::jsonb,
         body := '{}'::jsonb
       );
       $$
     );
   ```

## 📊 Monitoreo y Analytics

### Google Analytics (Opcional)

1. Crear cuenta en Google Analytics
2. Instalar react-ga4:
   ```bash
   npm install react-ga4
   ```
3. Agregar en `main.jsx`:
   ```javascript
   import ReactGA from 'react-ga4'
   
   ReactGA.initialize('TU-TRACKING-ID')
   ```

### Sentry para Error Tracking (Opcional)

```bash
npm install @sentry/react
```

En `main.jsx`:
```javascript
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'tu-dsn',
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  })
}
```

## 🔒 Seguridad

### Checklist de Seguridad Pre-Producción

- [ ] Variables de entorno NO están en el código
- [ ] `.env` está en `.gitignore`
- [ ] RLS está habilitado en todas las tablas de Supabase
- [ ] Las políticas RLS están bien configuradas
- [ ] CORS está configurado correctamente
- [ ] Redirect URLs están configuradas en Supabase
- [ ] SSL/HTTPS está habilitado
- [ ] Validaciones de input en frontend y backend
- [ ] Rate limiting en Edge Functions (si aplica)

### Headers de Seguridad

Agregar en `vercel.json` o `netlify.toml`:

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 🧪 Testing en Producción

### 1. Verificar Funcionalidad Core

- [ ] Registro de usuarios (donor y requester)
- [ ] Login/Logout
- [ ] Creación de solicitudes
- [ ] Respuestas a solicitudes
- [ ] Visualización de mapas
- [ ] Cálculo de distancias
- [ ] Filtrado por tipo de sangre
- [ ] Estados de solicitudes
- [ ] Notificaciones en tiempo real

### 2. Testing de Performance

Herramientas:
- Google PageSpeed Insights
- Lighthouse (en Chrome DevTools)
- WebPageTest.org

Objetivos:
- Performance score > 90
- First Contentful Paint < 1.8s
- Time to Interactive < 3.9s
- Largest Contentful Paint < 2.5s

### 3. Testing de Responsividad

Probar en:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet
- [ ] Desktop (Chrome, Firefox, Safari, Edge)

## 📈 Optimizaciones Post-Deployment

### 1. Optimizar Imágenes

Si usas imágenes estáticas:
```bash
npm install vite-plugin-image-optimizer -D
```

En `vite.config.js`:
```javascript
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default {
  plugins: [
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      png: { quality: 80 },
      jpeg: { quality: 80 },
    }),
  ],
}
```

### 2. Lazy Loading de Componentes

Para rutas grandes:
```javascript
import { lazy, Suspense } from 'react'

const DonorDashboard = lazy(() => import('./pages/DonorDashboard'))

// En el router
<Suspense fallback={<div>Cargando...</div>}>
  <DonorDashboard />
</Suspense>
```

### 3. Configurar CDN para Assets

Si usas Vercel/Netlify, esto está configurado automáticamente.

## 🐛 Troubleshooting

### Error: "Failed to fetch" en producción

**Causa:** URLs de Supabase incorrectas
**Solución:** Verificar variables de entorno en el hosting

### Error: "CORS policy" en API calls

**Causa:** Dominio no whitelisted en Supabase
**Solución:** Agregar dominio en Supabase Settings → API → CORS

### Error: Redirect loop después de login

**Causa:** Redirect URLs no configuradas
**Solución:** Agregar URLs en Supabase Authentication settings

### Mapas no cargan en producción

**Causa:** Leaflet CSS no cargado correctamente
**Solución:** Verificar que `leaflet/dist/leaflet.css` está en `main.jsx`

### Error: "Unable to verify the first certificate"

**Causa:** SSL no configurado
**Solución:** Habilitar HTTPS en el hosting

## 🔄 CI/CD (Opcional)

### GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests (si tienes)
        run: npm test
        
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 Checklist Final de Deployment

- [ ] Código pusheado a repositorio
- [ ] Variables de entorno configuradas en hosting
- [ ] Build exitoso en plataforma de hosting
- [ ] Dominio personalizado configurado (si aplica)
- [ ] URLs actualizadas en Supabase
- [ ] CORS configurado
- [ ] SSL habilitado
- [ ] Edge Functions desplegadas (si aplica)
- [ ] Cron jobs configurados (si aplica)
- [ ] Todas las funcionalidades probadas
- [ ] Performance optimizado
- [ ] Analytics configurado (opcional)
- [ ] Error tracking configurado (opcional)
- [ ] Documentación actualizada

## 🎉 Post-Launch

1. **Monitorear errores** en las primeras 24-48 horas
2. **Revisar analytics** para identificar problemas de UX
3. **Recopilar feedback** de usuarios iniciales
4. **Preparar hotfixes** si es necesario
5. **Planificar iteraciones** basadas en uso real

---

**¡Felicidades por el deployment! 🚀**

Si encuentras problemas, revisa:
1. Logs de la plataforma de hosting
2. Console del navegador
3. Logs de Supabase (si aplica)
4. Esta guía de troubleshooting
