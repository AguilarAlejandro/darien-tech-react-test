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
  latitude: number
  longitude: number
  createdAt: string
  updatedAt: string
}

export interface CreateLocationDto {
  name: string
  latitude: number
  longitude: number
}

export type UpdateLocationDto = Partial<CreateLocationDto>

// ─── Space ───────────────────────────────────────────────────────────────────
export interface Space {
  id: string
  locationId: string
  name: string
  capacity: number
  reference?: string
  description?: string
  location?: Location
  createdAt: string
  updatedAt: string
}

export interface CreateSpaceDto {
  locationId: string
  name: string
  capacity: number
  reference?: string
  description?: string
}

export type UpdateSpaceDto = Partial<Omit<CreateSpaceDto, 'locationId'>>

// ─── Booking ─────────────────────────────────────────────────────────────────
export interface Booking {
  id: string
  spaceId: string
  locationId: string
  clientEmail: string
  bookingDate: string
  startTime: string
  endTime: string
  space?: Space
  location?: Location
  createdAt: string
  updatedAt: string
}

export interface CreateBookingDto {
  spaceId: string
  clientEmail: string
  bookingDate: string
  startTime: string
  endTime: string
}

export interface UpdateBookingDto {
  bookingDate?: string
  startTime?: string
  endTime?: string
}

export interface FindBookingsQuery {
  page?: number
  pageSize?: number
  spaceId?: string
  clientEmail?: string
  dateFrom?: string
  dateTo?: string
}

export interface FindLocationsQuery {
  page?: number
  pageSize?: number
}

export interface FindSpacesQuery {
  page?: number
  pageSize?: number
  locationId?: string
}

// ─── IoT / Digital Twin ───────────────────────────────────────────────────────
export interface DesiredState {
  id: string
  spaceId: string
  co2AlertThreshold: number
  samplingIntervalSec: number
  updatedAt: string
}

export interface ReportedState {
  id: string
  spaceId: string
  samplingIntervalSec?: number
  co2AlertThreshold?: number
  firmwareVersion?: string
  reportedAt: string
  updatedAt: string
}

export interface DigitalTwin {
  desired: DesiredState | null
  reported: ReportedState | null
}

export type UpdateDesiredDto = {
  co2AlertThreshold?: number
  samplingIntervalSec?: number
}

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
  metaJson: Record<string, unknown>
  startedAt: string
  resolvedAt: string | null
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
  metaJson?: Record<string, unknown>
  startedAt?: string
  resolvedAt?: string | null
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
