# Kero-Kero Dashboard

Panel de control administrativo para la gestión de instancias de WhatsApp Kero-Kero.

## Características

- Gestión de instancias (Crear, Eliminar, Reiniciar)
- Visualización de códigos QR para vinculación
- Monitorización de estado de conexión
- Configuración de Webhooks
- Interfaz moderna y responsiva

## Requisitos Previos

- Node.js 20+
- NPM

## Instalación y Desarrollo Local

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar servidor de desarrollo:
```bash
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`.

## Construcción para Producción

Para generar la versión optimizada para producción:

```bash
npm run build
npm start
```

## Docker

### Crear Imagen

```bash
docker build -t kero-kero-dashboard .
```

### Ejecutar Contenedor

```bash
docker run -p 3000:3000 kero-kero-dashboard
```

## Configuración de Entorno

Crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# URL de la API del servidor
NEXT_PUBLIC_API_URL=http://localhost:8080

# API Key para autenticación (debe coincidir con la del servidor)
NEXT_PUBLIC_API_KEY=dev-api-key-12345

# Contraseña para acceder al dashboard
# IMPORTANTE: Esta contraseña protege el acceso al dashboard

DASHBOARD_PASSWORD=admin123

```

> **Nota**: La API Key (`NEXT_PUBLIC_API_KEY`) debe coincidir con la variable `API_KEY` configurada en el servidor.

Puedes usar el archivo `.env.example` como referencia.
