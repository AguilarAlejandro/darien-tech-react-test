import axios from 'axios'
import type {
  Location, CreateLocationDto, UpdateLocationDto,
  Space, CreateSpaceDto, UpdateSpaceDto,
  Booking, CreateBookingDto, UpdateBookingDto,
  FindBookingsQuery, FindLocationsQuery, FindSpacesQuery,
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

// ─── Locations ───────────────────────────────────────────────────────────────
export const locationsApi = {
  list: (params?: FindLocationsQuery) =>
    http.get<PaginatedResponse<Location>>('/api/v1/locations', { params }).then((r) => r.data),
  get: (id: string) => http.get<Location>(`/api/v1/locations/${id}`).then((r) => r.data),
  create: (dto: CreateLocationDto) => http.post<Location>('/api/v1/locations', dto).then((r) => r.data),
  update: (id: string, dto: UpdateLocationDto) =>
    http.patch<Location>(`/api/v1/locations/${id}`, dto).then((r) => r.data),
  delete: (id: string) => http.delete<void>(`/api/v1/locations/${id}`),
}

// ─── Spaces ──────────────────────────────────────────────────────────────────
export const spacesApi = {
  list: (params?: FindSpacesQuery) =>
    http.get<PaginatedResponse<Space>>('/api/v1/spaces', { params }).then((r) => r.data),
  get: (id: string) => http.get<Space>(`/api/v1/spaces/${id}`).then((r) => r.data),
  create: (dto: CreateSpaceDto) => http.post<Space>('/api/v1/spaces', dto).then((r) => r.data),
  update: (id: string, dto: UpdateSpaceDto) =>
    http.patch<Space>(`/api/v1/spaces/${id}`, dto).then((r) => r.data),
  delete: (id: string) => http.delete<void>(`/api/v1/spaces/${id}`),
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (params?: FindBookingsQuery) =>
    http.get<PaginatedResponse<Booking>>('/api/v1/bookings', { params }).then((r) => r.data),
  get: (id: string) => http.get<Booking>(`/api/v1/bookings/${id}`).then((r) => r.data),
  create: (dto: CreateBookingDto) =>
    http.post<Booking>('/api/v1/bookings', dto).then((r) => r.data),
  update: (id: string, dto: UpdateBookingDto) =>
    http.patch<Booking>(`/api/v1/bookings/${id}`, dto).then((r) => r.data),
  delete: (id: string) => http.delete<void>(`/api/v1/bookings/${id}`),
}

// ─── IoT ─────────────────────────────────────────────────────────────────────
export const iotApi = {
  getTwin: (spaceId: string) =>
    http.get<DigitalTwin>(`/api/v1/iot/spaces/${spaceId}/twin`).then((r) => r.data),
  updateDesired: (spaceId: string, dto: UpdateDesiredDto) =>
    http.patch<DigitalTwin>(`/api/v1/iot/spaces/${spaceId}/desired`, dto).then((r) => r.data),
  getTelemetry: (spaceId: string, params?: { minutes?: number }) =>
    http.get<TelemetryAggregation[]>(`/api/v1/iot/spaces/${spaceId}/telemetry`, { params }).then((r) => r.data),
  getAlerts: (spaceId: string, params?: { open?: boolean }) =>
    http.get<Alert[]>(`/api/v1/iot/spaces/${spaceId}/alerts`, { params }).then((r) => r.data),
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
