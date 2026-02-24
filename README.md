# CoworkSpace — Dashboard Frontend

Aplicación web para la gestión de espacios de coworking. Construida con **Next.js 16**, **React 19**, **TypeScript** y **Tailwind CSS**. Se conecta a la CoworkSpace API para gestionar lugares, espacios, reservas y telemetría IoT en tiempo real.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v20 o superior
- La **CoworkSpace API** corriendo en `http://localhost:3000` (ver su README para instrucciones de puesta en marcha)
- `npm` instalado

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Si la API corre en otro puerto o host, ajusta este valor.

---

## Instalación y ejecución

### Modo desarrollo

```bash
npm install
npm run dev
```

La aplicación estará disponible en: `http://localhost:3001`

> Por defecto Next.js usa el puerto 3000. Si la API ya ocupa ese puerto, Next.js asignará automáticamente el 3001. Puedes forzarlo con `PORT=3001 npm run dev`.

### Modo producción

```bash
npm run build
npm start
```

---

## Inicio de sesión

Al abrir la aplicación se muestra una pantalla de login. Ingresa una **API key** de la CoworkSpace API:

| API Key | Rol | Acceso |
|---------|-----|--------|
| `admin-secret-key-123` | ADMIN | Lectura y escritura completa (crear/editar/eliminar lugares, espacios, reservas) |
| `user-secret-key-456` | USER | Solo lectura + crear y eliminar reservas propias |

La key se guarda en `localStorage` y se envía automáticamente en el header `x-api-key` de todas las peticiones.

---

## Secciones del dashboard

### 📍 Lugares

Listado de todas las sedes/ubicaciones. Muestra el ID completo, nombre, latitud y longitud.

- **Solo ADMIN**: crear nuevos lugares, editar nombre y coordenadas, eliminar (solo si no tiene espacios asociados).

### 🏢 Espacios

Listado de espacios de coworking. Filtra por sede con el selector desplegable.

- **Solo ADMIN**: crear, editar y eliminar espacios.

### 📅 Reservas

Gestión de reservas con paginación (10 por página).

- **Filtro por email**: búsqueda parcial e insensible a mayúsculas — se debouncea 400 ms para no disparar peticiones en cada tecla.
- Crear una reserva requiere seleccionar espacio, email del cliente, fecha y horario de inicio/fin.
- **Reglas de negocio** aplicadas por la API:
  - No se permiten solapamientos de horario en el mismo espacio (`409 Conflict`).
  - Máximo 3 reservas por semana para el mismo email (`400 Bad Request`).
  - La hora de inicio debe ser igual o posterior a la fecha de la reserva.
- Los errores de validación se muestran en español como notificaciones toast.

### 🌐 IoT Dashboard

Panel de telemetría en tiempo real para los espacios equipados con sensores.

#### Digital Twin
Muestra el estado actual del espacio: temperatura, CO₂, humedad, ocupación, potencia y estado de batería. También muestra la configuración `desired` (intervalo de muestreo, umbral de CO₂) y el estado `reported` del dispositivo.

- **Solo ADMIN**: editar la configuración del gemelo digital (intervalo de muestreo, umbral de alerta CO₂) y los horarios de oficina.

#### Telemetría
Gráficas de los últimos 60 minutos: temperatura (°C), CO₂ (ppm) y ocupación. Los datos se cargan desde el endpoint REST al cambiar de espacio.

> Las gráficas solo muestran datos si el simulador IoT ha estado enviando telemetría. Consulta la sección **Módulo IoT** en el README del backend.

#### Alertas
Lista de alertas del espacio seleccionado dividida en activas y cerradas.

- Las alertas **activas** se muestran en naranja con un mensaje legible (p. ej. `1340 ppm — umbral: 1000 ppm`).
- Las alertas **cerradas** muestran la hora de resolución.
- Las alertas en tiempo real llegan por **SSE** y aparecen como toast y en el banner superior de la página.

#### Conexión SSE
La aplicación se conecta automáticamente al stream `GET /api/v1/iot/stream?key=<api-key>` usando `EventSource`. En caso de error se reconecta tras 5 segundos. El stream entrega tres tipos de eventos:

| Evento | Descripción |
|--------|-------------|
| `telemetry` | Nueva lectura de sensor publicada por el simulador |
| `alert` | Alerta abierta por el motor de alertas |
| `twin_update` | Cambio en el estado `reported` del gemelo digital |

> El stream SSE solo recibe eventos cuando el **simulador IoT está corriendo**. Consulta el README del backend para las instrucciones de arranque.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/       # Pantalla de login con API key
│   └── dashboard/
│       ├── layout.tsx       # Layout del dashboard (sidebar + nav)
│       ├── locations/       # Página de lugares
│       ├── spaces/          # Página de espacios
│       ├── bookings/        # Página de reservas
│       └── iot/             # Dashboard IoT (twin, telemetría, alertas)
├── components/
│   └── ui/                  # Componentes base (Button, Card, Table, Input…)
├── contexts/
│   └── AuthContext.tsx      # Contexto de autenticación (apiKey, role)
├── hooks/
│   ├── useSSE.ts            # Hook para la conexión EventSource
│   └── useDebounce.ts       # Hook de debounce genérico
└── lib/
    ├── api.ts               # Cliente HTTP (axios) + funciones de cada recurso
    └── types.ts             # Tipos TypeScript compartidos
```

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| Next.js 16 (App Router) | Framework React con SSR/CSR |
| React 19 | UI |
| TypeScript | Tipado estático |
| Tailwind CSS v4 | Estilos |
| shadcn/ui (Radix UI) | Componentes accesibles |
| axios | Cliente HTTP |
| Recharts | Gráficas de telemetría |
| react-hot-toast | Notificaciones |
| EventSource (nativo) | Stream SSE en tiempo real |
