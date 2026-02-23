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

// ─── Location ────────────────────────────────────────────────────────────────
export interface Location {
  id: string
  name: string
  address: string
  city: string
  createdAt: string
  updatedAt: string
}

export interface CreateLocationDto {
  name: string
  address: string
  city: string
}

export type UpdateLocationDto = Partial<CreateLocationDto>

// ─── Space ───────────────────────────────────────────────────────────────────
export interface Space {
  id: string
  locationId: string
  name: string
  type: SpaceType
  capacity: number
  hourlyRate: number
  active: boolean
  location?: Location
  createdAt: string
  updatedAt: string
}

export type SpaceType = 'SALA_REUNION' | 'ESCRITORIO' | 'OFICINA_PRIVADA'

export interface CreateSpaceDto {
  locationId: string
  name: string
  type: SpaceType
  capacity: number
  hourlyRate: number
  active?: boolean
}

export type UpdateSpaceDto = Partial<Omit<CreateSpaceDto, 'locationId'>>

// ─── Booking ─────────────────────────────────────────────────────────────────
export interface Booking {
  id: string
  spaceId: string
  locationId: string
  userEmail: string
  userName: string
  startDate: string
  endDate: string
  status: BookingStatus
  notes?: string
  space?: Space
  location?: Location
  createdAt: string
  updatedAt: string
}

export type BookingStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA'

export interface CreateBookingDto {
  spaceId: string
  userEmail: string
  userName: string
  startDate: string
  endDate: string
  notes?: string
}

export interface UpdateBookingDto {
  status?: BookingStatus
  notes?: string
}

export interface FindBookingsQuery {
  page?: number
  pageSize?: number
  spaceId?: string
  userEmail?: string
  status?: BookingStatus
  dateFrom?: string
  dateTo?: string
}

// ─── IoT / Digital Twin ───────────────────────────────────────────────────────
export interface DesiredState {
  maxOccupancy: number
  co2AlertThreshold: number
  samplingIntervalSec: number
  hvacEnabled: boolean
  lightingLevel: number
}

export interface ReportedState {
  tempC: number
  co2Ppm: number
  currentOccupancy: number
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
  spaceId: string
  windowStart: string
  windowEnd: string
  tempCAvg: number | null
  tempCMin: number | null
  tempCMax: number | null
  co2PpmAvg: number | null
  co2PpmMax: number | null
  occupancyAvg: number | null
  occupancyMax: number | null
  sampleCount: number
}

export interface Alert {
  id: string
  spaceId: string
  kind: AlertKind
  message: string
  openedAt: string
  closedAt: string | null
  space?: Space
}

export type AlertKind = 'CO2' | 'OCCUPANCY_MAX' | 'OCCUPANCY_UNEXPECTED'

// ─── SSE Events ──────────────────────────────────────────────────────────────
export interface SSETelemetryEvent {
  spaceId: string
  data: ReportedState & { windowStart?: string; windowEnd?: string }
}

export interface SSEAlertEvent {
  spaceId: string
  kind: AlertKind
  message: string
  openedAt?: string
  closedAt?: string | null
}

export interface SSETwinUpdateEvent {
  spaceId: string
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
