# 🔐 Sistema de Seguridad del Dashboard - Doble Capa

## Problema Identificado

Con las variables `NEXT_PUBLIC_*`, las credenciales se exponen en el bundle del cliente (JavaScript público), lo que significa que **cualquier persona con acceso al link del dashboard** podría ver las credenciales en el código fuente del navegador.

## Solución Implementada: Autenticación de Doble Capa

### Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                    │
└─────────────────────────────────────────────────────────────┘

1. Usuario → Ingresa DASHBOARD_PASSWORD
   │
   ├─> Validación en servidor Next.js (NO en cliente)
   │
   └─> SI es correcta ↓

2. Next.js API Route → Llama al servidor Go con API_KEY
   │
   ├─> POST /auth/login con API_KEY
   │
   └─> Recibe JWT Token ↓

3. Dashboard → Guarda JWT Token en localStorage
   │
   └─> Todas las peticiones usan JWT Token
```

## Capas de Seguridad

### 🔒 Capa 1: Contraseña del Dashboard

**Variable**: `DASHBOARD_PASSWORD` (en `.env.local` del dashboard)

- **NO es pública** (no usa `NEXT_PUBLIC_`)
- Solo accesible desde el servidor Next.js
- El usuario **DEBE ingresarla manualmente**
- Protege el acceso al dashboard

**Propósito**: Evitar que cualquiera con el link pueda acceder.

### 🔐 Capa 2: API Key del Servidor

**Variable**: `API_KEY` (en `.env.local` del dashboard)

- **NO es pública** (no usa `NEXT_PUBLIC_`)
- Solo accesible desde el servidor Next.js
- **Nunca se expone al navegador**
- Se usa para autenticarse con el servidor Go

**Propósito**: Autenticar el dashboard con el backend Go.

### 🎫 Capa 3: JWT Token

- Generado por el servidor Go
- Válido por 24 horas
- Se guarda en localStorage
- Se usa para todas las peticiones a la API

**Propósito**: Sesión segura sin exponer credenciales.

## Configuración

### Dashboard (`.env.local`)

```bash
# URL pública del servidor
NEXT_PUBLIC_API_URL=http://localhost:8080

# ============================================
# SEGURIDAD DEL DASHBOARD
# ============================================

# Contraseña que el usuario ingresa en el login
# ⚠️ CAMBIAR en producción
DASHBOARD_PASSWORD=admin123

# API Key del servidor (nunca se expone al cliente)
# Debe coincidir con la del servidor Go
API_KEY=dev-api-key-12345
```

### Servidor (`.env.local`)

```bash
# API Key del servidor
API_KEY=dev-api-key-12345

# Secreto para firmar JWT tokens
JWT_SECRET=dev-jwt-secret-67890
```

## Flujo Detallado

### 1. Login del Usuario

```typescript
// Usuario ingresa contraseña en el formulario
POST /api/auth/login
{
  "password": "admin123"
}
```

### 2. Validación en el Servidor Next.js

```typescript
// app/api/auth/login/route.ts (SERVIDOR - NO CLIENTE)
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD // Privada
const API_KEY = process.env.API_KEY // Privada

if (password !== DASHBOARD_PASSWORD) {
  return error 401
}

// Si es correcta, autenticar con el backend Go
const response = await fetch(`${API_URL}/auth/login`, {
  body: JSON.stringify({ api_key: API_KEY })
})

// Devolver JWT al cliente
return { token: jwt, expires_at: ... }
```

### 3. Cliente Guarda JWT Token

```typescript
// app/login/page.tsx (CLIENTE)
localStorage.setItem('kero_jwt_token', data.token)
localStorage.setItem('kero_jwt_expires', data.expires_at)
```

### 4. Peticiones de API

```typescript
// lib/api.ts
// Interceptor agrega JWT automáticamente
config.headers.Authorization = `Bearer ${jwtToken}`
```

## Ventajas de Este Sistema

✅ **Credenciales nunca se exponen al cliente**
- `DASHBOARD_PASSWORD` y `API_KEY` solo existen en el servidor
- El navegador nunca ve estas credenciales

✅ **Protección contra acceso no autorizado**
- Link del dashboard sin contraseña = no sirve
- Incluso si alguien inspecciona el código

✅ **Separación de responsabilidades**
- Contraseña del dashboard = acceso local
- API Key = comunicación entre servicios
- JWT Token = sesión temporal

✅ **Auditable y controlable**
- Puedes cambiar `DASHBOARD_PASSWORD` sin tocar el backend
- Logs de autenticación en ambos lados

## Archivos Modificados

### Dashboard

1. **`.env.local`**
   - Agregada `DASHBOARD_PASSWORD`
   - Cambiada `NEXT_PUBLIC_API_KEY` → `API_KEY` (privada)

2. **`app/api/auth/login/route.ts`** (NUEVO)
   - API route del servidor
   - Valida contraseña
   - Obtiene JWT del backend

3. **`app/login/page.tsx`**
   - Formulario con campo de contraseña
   - Llama a `/api/auth/login` (no directamente al backend)

4. **`lib/api.ts`**
   - Simplificado para usar solo JWT tokens
   - Eliminada lógica de API Key en el cliente

## Comparación: Antes vs Ahora

### ❌ Antes (INSEGURO)

```
Usuario → Abre link → Dashboard carga automáticamente
          ↓
    Credenciales en NEXT_PUBLIC_API_KEY (públicas)
          ↓
    Cualquiera con el link puede acceder
```

### ✅ Ahora (SEGURO)

```
Usuario → Abre link → Login con contraseña
          ↓
    DASHBOARD_PASSWORD validada en servidor
          ↓
    API_KEY nunca se expone al cliente
          ↓
    JWT Token para sesión temporal
```

## Testing

### Probar autenticación correcta

```bash
# En el dashboard, ingresar:
Contraseña: admin123

# Debe:
1. Validar contraseña en el servidor Next.js
2. Obtener JWT del backend Go
3. Guardar token en localStorage
4. Redirigir al dashboard
```

### Probar contraseña incorrecta

```bash
# En el dashboard, ingresar:
Contraseña: wrongpassword

# Debe:
1. Mostrar error "Contraseña incorrecta"
2. NO permitir acceso
```

### Verificar que credenciales no sean públicas

```bash
# 1. Abrir DevTools en el navegador
# 2. Ir a Sources → Ver archivos .js
# 3. Buscar "API_KEY" o "DASHBOARD_PASSWORD"
# Resultado esperado: NO deben aparecer
```

## Seguridad en Producción

### ⚠️ IMPORTANTE: Cambiar Credenciales

```bash
# Dashboard .env.local
DASHBOARD_PASSWORD=<contraseña-segura-aleatoria>
API_KEY=<copiar-del-servidor>

# Servidor .env
API_KEY=<clave-aleatoria-segura>
JWT_SECRET=<generar-con-openssl-rand-base64-32>
```

### Generar Contraseñas Seguras

```bash
# Dashboard password (que el usuario recordará)
# Usar un gestor de contraseñas o generador

# API Key y JWT Secret (aleatorios)
openssl rand -base64 32
```

### Mejores Prácticas

1. ✅ Usa HTTPS en producción
2. ✅ Cambia todas las contraseñas por defecto
3. ✅ No commitees `.env.local` al repositorio
4. ✅ Usa variables de entorno en producción
5. ✅ Implementa rate limiting en el login
6. ✅ Considera 2FA para mayor seguridad

## Troubleshooting

### Error: "Contraseña incorrecta"

**Causa**: La contraseña no coincide con `DASHBOARD_PASSWORD`

**Solución**: Verificar el valor en `.env.local` del dashboard

### Error: "Dashboard no configurado"

**Causa**: Falta `DASHBOARD_PASSWORD` o `API_KEY` en `.env`

**Solución**: Agregar ambas variables al archivo `.env.local`

### Error: "Error autenticando con el servidor"

**Causa**: El `API_KEY` del dashboard no coincide con el del servidor

**Solución**: Asegurar que ambos archivos `.env` tengan el mismo `API_KEY`

## Próximas Mejoras Sugeridas

1. **Rate Limiting en Login**
   - Limitar intentos de contraseña
   - Prevenir ataques de fuerza bruta

2. **Autenticación de 2 Factores (2FA)**
   - Código de verificación adicional
   - Email o SMS

3. **Múltiples Usuarios**
   - Base de datos de usuarios
   - Contraseñas individuales
   - Roles y permisos

4. **Auditoria de Accesos**
   - Log de todos los logins
   - Detección de accesos sospechosos

---

**¡Sistema de doble capa implementado con éxito! 🔒**
