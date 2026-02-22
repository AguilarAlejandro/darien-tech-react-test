import axios from 'axios'
import type {
  Lugar, CreateLugarDto, UpdateLugarDto,
  Espacio, CreateEspacioDto, UpdateEspacioDto,
  Reserva, CreateReservaDto, UpdateReservaDto, FindReservasQuery,
  PaginatedResponse,
  DigitalTwin, UpdateDesiredDto, TelemetryAggregation, Alert,
  ApiKey,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const http = axios.create({ baseURL: API_URL })

// Attach API key on every request
http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const key = localStorage.getItem('apiKey')
    if (key) config.headers['x-api-key'] = key
  }
  return config
})

// ─── Lugares ─────────────────────────────────────────────────────────────────
export const lugaresApi = {
  list: () => http.get<Lugar[]>('/api/v1/lugares').then((r) => r.data),
  get: (id: string) => http.get<Lugar>(`/api/v1/lugares/${id}`).then((r) => r.data),
  create: (dto: CreateLugarDto) => http.post<Lugar>('/api/v1/lugares', dto).then((r) => r.data),
  update: (id: string, dto: UpdateLugarDto) =>
    http.patch<Lugar>(`/api/v1/lugares/${id}`, dto).then((r) => r.data),
  delete: (id: string) => http.delete<void>(`/api/v1/lugares/${id}`),
}

// ─── Espacios ────────────────────────────────────────────────────────────────
export const espaciosApi = {
  list: (params?: { lugarId?: string; tipo?: string; active?: boolean }) =>
    http.get<Espacio[]>('/api/v1/espacios', { params }).then((r) => r.data),
  get: (id: string) => http.get<Espacio>(`/api/v1/espacios/${id}`).then((r) => r.data),
  create: (dto: CreateEspacioDto) => http.post<Espacio>('/api/v1/espacios', dto).then((r) => r.data),
  update: (id: string, dto: UpdateEspacioDto) =>
    http.patch<Espacio>(`/api/v1/espacios/${id}`, dto).then((r) => r.data),
  delete: (id: string) => http.delete<void>(`/api/v1/espacios/${id}`),
}

// ─── Reservas ────────────────────────────────────────────────────────────────
export const reservasApi = {
  list: (params?: FindReservasQuery) =>
    http.get<PaginatedResponse<Reserva>>('/api/v1/reservas', { params }).then((r) => r.data),
  get: (id: string) => http.get<Reserva>(`/api/v1/reservas/${id}`).then((r) => r.data),
  create: (dto: CreateReservaDto) =>
    http.post<Reserva>('/api/v1/reservas', dto).then((r) => r.data),
  update: (id: string, dto: UpdateReservaDto) =>
    http.patch<Reserva>(`/api/v1/reservas/${id}`, dto).then((r) => r.data),
  cancel: (id: string) =>
    http.patch<Reserva>(`/api/v1/reservas/${id}`, { estado: 'CANCELADA' }).then((r) => r.data),
  delete: (id: string) => http.delete<void>(`/api/v1/reservas/${id}`),
}

// ─── IoT ─────────────────────────────────────────────────────────────────────
export const iotApi = {
  getTwin: (espacioId: string) =>
    http.get<DigitalTwin>(`/api/v1/iot/espacios/${espacioId}/twin`).then((r) => r.data),
  updateDesired: (espacioId: string, dto: UpdateDesiredDto) =>
    http.patch<DigitalTwin>(`/api/v1/iot/espacios/${espacioId}/desired`, dto).then((r) => r.data),
  getTelemetry: (espacioId: string, params?: { from?: string; to?: string; limit?: number }) =>
    http.get<TelemetryAggregation[]>(`/api/v1/iot/espacios/${espacioId}/telemetry`, { params }).then((r) => r.data),
  getAlerts: (espacioId: string, params?: { open?: boolean }) =>
    http.get<Alert[]>(`/api/v1/iot/espacios/${espacioId}/alerts`, { params }).then((r) => r.data),
}

// ─── Validate API key ─────────────────────────────────────────────────────────
export async function validateApiKey(key: string): Promise<'ADMIN' | 'USER' | null> {
  try {
    const res = await axios.get<{ status: string }>(`${API_URL}/health`, {
      headers: { 'x-api-key': key },
    })
    if (res.status === 200) {
      // Check role by hitting an admin endpoint
      try {
        await axios.get(`${API_URL}/api/v1/api-keys`, {
          headers: { 'x-api-key': key },
        })
        return 'ADMIN'
      } catch {
        return 'USER'
      }
    }
    return null
  } catch {
    return null
  }
}

// ─── SSE URL builder ─────────────────────────────────────────────────────────
export function sseUrl(apiKey: string): string {
  return `${API_URL}/api/v1/iot/stream?key=${encodeURIComponent(apiKey)}`
}
