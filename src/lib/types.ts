// ─── Pagination ─────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ─── Lugar ──────────────────────────────────────────────────────────────────
export interface Lugar {
  id: string
  nombre: string
  direccion: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

export interface CreateLugarDto {
  nombre: string
  direccion: string
  ciudad: string
}

export type UpdateLugarDto = Partial<CreateLugarDto>

// ─── Espacio ─────────────────────────────────────────────────────────────────
export interface Espacio {
  id: string
  lugarId: string
  nombre: string
  tipo: EspacioTipo
  capacidad: number
  tarifaHora: number
  activo: boolean
  lugar?: Lugar
  createdAt: string
  updatedAt: string
}

export type EspacioTipo = 'SALA_REUNION' | 'ESCRITORIO' | 'OFICINA_PRIVADA'

export interface CreateEspacioDto {
  lugarId: string
  nombre: string
  tipo: EspacioTipo
  capacidad: number
  tarifaHora: number
  activo?: boolean
}

export type UpdateEspacioDto = Partial<Omit<CreateEspacioDto, 'lugarId'>>

// ─── Reserva ─────────────────────────────────────────────────────────────────
export interface Reserva {
  id: string
  espacioId: string
  lugarId: string
  usuarioEmail: string
  usuarioNombre: string
  fechaInicio: string
  fechaFin: string
  estado: ReservaEstado
  notas?: string
  espacio?: Espacio
  lugar?: Lugar
  createdAt: string
  updatedAt: string
}

export type ReservaEstado = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA'

export interface CreateReservaDto {
  espacioId: string
  usuarioEmail: string
  usuarioNombre: string
  fechaInicio: string
  fechaFin: string
  notas?: string
}

export interface UpdateReservaDto {
  estado?: ReservaEstado
  notas?: string
}

export interface FindReservasQuery {
  page?: number
  pageSize?: number
  espacioId?: string
  usuarioEmail?: string
  estado?: ReservaEstado
  fechaDesde?: string
  fechaHasta?: string
}

// ─── IoT / Digital Twin ───────────────────────────────────────────────────────
export interface DesiredState {
  maxOcupacion: number
  co2AlertThreshold: number
  samplingIntervalSec: number
  hvacEnabled: boolean
  lightingLevel: number
}

export interface ReportedState {
  tempC: number
  co2Ppm: number
  ocupacionActual: number
  humedadPct: number
  timestamp: string
}

export interface DigitalTwin {
  desired: DesiredState
  reported: ReportedState | null
}

export type UpdateDesiredDto = Partial<DesiredState>

export interface TelemetryAggregation {
  id: string
  espacioId: string
  windowStart: string
  windowEnd: string
  tempCAvg: number | null
  tempCMin: number | null
  tempCMax: number | null
  co2PpmAvg: number | null
  co2PpmMax: number | null
  ocupacionAvg: number | null
  ocupacionMax: number | null
  sampleCount: number
}

export interface Alert {
  id: string
  espacioId: string
  kind: AlertKind
  message: string
  openedAt: string
  closedAt: string | null
  espacio?: Espacio
}

export type AlertKind = 'CO2' | 'OCCUPANCY_MAX' | 'OCCUPANCY_UNEXPECTED'

// ─── SSE Events ──────────────────────────────────────────────────────────────
export interface SSETelemetryEvent {
  espacioId: string
  data: ReportedState & { windowStart?: string; windowEnd?: string }
}

export interface SSEAlertEvent {
  espacioId: string
  kind: AlertKind
  message: string
  openedAt?: string
  closedAt?: string | null
}

export interface SSETwinUpdateEvent {
  espacioId: string
  desired?: Partial<DesiredState>
  reported?: Partial<ReportedState>
}

// ─── API Key ──────────────────────────────────────────────────────────────────
export interface ApiKey {
  id: string
  name: string
  role: 'ADMIN' | 'USER'
  createdAt: string
}

export interface AuthContext {
  apiKey: string
  role: 'ADMIN' | 'USER'
}
