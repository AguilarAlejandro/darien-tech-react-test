'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { spacesApi, iotApi } from '@/lib/api'
import type { Space, DigitalTwin, TelemetryAggregation, Alert, AlertKind, SSETelemetryEvent, SSEAlertEvent } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { useSSE } from '@/hooks/useSSE'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert as AlertUI, AlertDescription } from '@/components/ui/alert'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import toast from 'react-hot-toast'

const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  CO2: '🌫️ CO₂ elevado',
  OCCUPANCY_MAX: '👥 Ocupación máxima',
  OCCUPANCY_UNEXPECTED: '👤 Ocupación inesperada',
}

function formatAlertDetail(kind: AlertKind, meta: Record<string, unknown> | undefined): string {
  if (!meta) return ''
  if (kind === 'CO2') {
    const value = meta.value as number | undefined
    const threshold = meta.threshold as number | undefined
    const unit = (meta.unit as string | undefined) ?? 'ppm'
    if (value !== undefined && threshold !== undefined) {
      return `${value} ${unit} — umbral: ${threshold} ${unit}`
    }
  }
  if (kind === 'OCCUPANCY_MAX') {
    const capacity = meta.capacity as number | undefined
    const occupancy = meta.occupancy as number | undefined
    if (capacity !== undefined && occupancy !== undefined) {
      return `Capacidad máxima alcanzada: ${Math.round(occupancy * 100)}% (${capacity} personas)`
    }
  }
  if (kind === 'OCCUPANCY_UNEXPECTED') {
    const occupancy = meta.occupancy as number | undefined
    if (occupancy !== undefined) {
      return `Ocupación fuera de horario: ${Math.round(occupancy * 100)}%`
    }
  }
  return ''
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function TwinPanel({
  spaceId,
  isAdmin,
}: {
  spaceId: string
  isAdmin: boolean
}) {
  const [twin, setTwin] = useState<DigitalTwin | null>(null)
  const [editing, setEditing] = useState(false)
  const [desired, setDesired] = useState<{ co2AlertThreshold?: number; samplingIntervalSec?: number }>({})
  const [saving, setSaving] = useState(false)

  const fetchTwin = useCallback(async () => {
    try {
      const data = await iotApi.getTwin(spaceId)
      setTwin(data)
      setDesired(data.desired ? { co2AlertThreshold: data.desired.co2AlertThreshold, samplingIntervalSec: data.desired.samplingIntervalSec } : {})
    } catch {
      toast.error('Error al cargar digital twin')
    }
  }, [spaceId])

  useEffect(() => { fetchTwin() }, [fetchTwin])

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await iotApi.updateDesired(spaceId, desired)
      setTwin(updated)
      setEditing(false)
      toast.success('Estado deseado actualizado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  if (!twin) return <div className="text-stone-400 text-sm animate-pulse">Cargando twin…</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Desired */}
        <Card className="border-teal-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-teal-700 flex items-center justify-between">
              Estado Deseado
              {isAdmin && (
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancelar' : 'Editar'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {editing ? (
              <div className="space-y-2">
                {(
                  [
                    ['co2AlertThreshold', 'Umbral CO₂ (ppm)', 'number'],
                    ['samplingIntervalSec', 'Intervalo muestreo (s)', 'number'],
                  ] as ['co2AlertThreshold' | 'samplingIntervalSec', string, string][]
                ).map(([k, label]) => (
                  <div key={k} className="space-y-0.5">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      value={desired[k] ?? ''}
                      onChange={(e) => setDesired((d) => ({ ...d, [k]: Number(e.target.value) }))}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
                <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs" onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            ) : (
              <dl className="space-y-1.5">
                {twin.desired ? [
                  ['Umbral CO₂', `${twin.desired.co2AlertThreshold} ppm`],
                  ['Intervalo muestreo', `${twin.desired.samplingIntervalSec}s`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <dt className="text-stone-500">{label}</dt>
                    <dd className="font-medium text-stone-700">{String(value)}</dd>
                  </div>
                )) : (
                  <p className="text-stone-400 text-xs">Sin configuración deseada</p>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Reported */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Estado Reportado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {twin.reported ? (
              <dl className="space-y-1.5">
                {[
                  ['Intervalo muestreo', twin.reported.samplingIntervalSec != null ? `${twin.reported.samplingIntervalSec}s` : '—'],
                  ['Umbral CO₂', twin.reported.co2AlertThreshold != null ? `${twin.reported.co2AlertThreshold} ppm` : '—'],
                  ['Firmware', twin.reported.firmwareVersion ?? '—'],
                  ['Última lectura', formatTime(twin.reported.reportedAt)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <dt className="text-stone-500">{label}</dt>
                    <dd className="font-medium text-stone-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-stone-400 text-xs">Sin datos reportados aún</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TelemetryCharts({ spaceId }: { spaceId: string }) {
  const [data, setData] = useState<TelemetryAggregation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    iotApi.getTelemetry(spaceId, { minutes: 60 })
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [spaceId])

  const chartData = data.map((d) => ({
    time: formatTime(d.windowStart),
    tempC: d.tempCAvg,
    co2: d.co2PpmAvg,
    occupancy: d.occupancyAvg,
  }))

  if (loading) return <div className="h-48 flex items-center justify-center text-stone-400 animate-pulse">Cargando telemetría…</div>
  if (data.length === 0) return <div className="h-48 flex items-center justify-center text-stone-400">Sin datos de telemetría</div>

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-stone-500 mb-2 font-medium">Temperatura (°C)</p>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Area type="monotone" dataKey="tempC" stroke="#0d9488" fill="url(#tempGrad)" name="Temp °C" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs text-stone-500 mb-2 font-medium">CO₂ (ppm)</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="co2" stroke="#f59e0b" name="CO₂ ppm" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs text-stone-500 mb-2 font-medium">Ocupación</p>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="ocupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="occupancy" stroke="#10b981" fill="url(#ocupGrad)" name="Ocupación" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AlertsPanel({ spaceId }: { spaceId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    iotApi.getAlerts(spaceId).then(setAlerts).catch(() => { })
  }, [spaceId])

  const open = alerts.filter((a) => !a.resolvedAt)
  const closed = alerts.filter((a) => a.resolvedAt)

  return (
    <div className="space-y-3">
      {open.length === 0 && (
        <p className="text-sm text-stone-400">✅ Sin alertas activas</p>
      )}
      {open.map((a) => (
        <AlertUI key={a.id} className="border-orange-200 bg-orange-50">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-orange-700">{ALERT_KIND_LABELS[a.kind]}</span>
              {formatAlertDetail(a.kind, a.metaJson) && (
                <p className="text-xs text-orange-600 mt-0.5">{formatAlertDetail(a.kind, a.metaJson)}</p>
              )}
              <p className="text-xs text-orange-500 mt-0.5">
                Desde: {new Date(a.startedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Activa</Badge>
          </AlertDescription>
        </AlertUI>
      ))}
      {closed.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-stone-400 font-medium pt-2">Alertas cerradas</p>
          {closed.slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 px-3 py-2 rounded">
              <span>{ALERT_KIND_LABELS[a.kind]}</span>
              <span className="text-right">
                {new Date(a.startedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                {' → '}
                {new Date(a.resolvedAt!).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function IotPage() {
  const { apiKey, role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [liveAlerts, setLiveAlerts] = useState<SSEAlertEvent[]>([])

  // Admin-only guard
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <h2 className="text-2xl font-bold text-stone-800">Access Denied</h2>
        <p className="text-stone-500">The IoT dashboard is only available to administrators.</p>
      </div>
    )
  }

  useEffect(() => {
    spacesApi.list().then((sp) => {
      setSpaces(sp)
      if (sp.length > 0) setSelectedId(sp[0].id)
    }).catch(() => { })
  }, [])

  // SSE subscription
  useSSE(apiKey, {
    onTelemetry: useCallback((e: SSETelemetryEvent) => {
      // Live telemetry updates could refresh chart here — for now toast
      if (e.spaceId === selectedId) {
        // silent update
      }
    }, [selectedId]),
    onAlert: useCallback((e: SSEAlertEvent) => {
      setLiveAlerts((prev) => [e, ...prev].slice(0, 10))
      toast.error(`⚠️ ${ALERT_KIND_LABELS[e.kind] ?? e.kind}`, { duration: 6000 })
    }, []),
  })

  const selectedSpace = spaces.find((e) => e.id === selectedId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">IoT Dashboard</h1>
          <p className="text-sm text-stone-500 mt-0.5">Telemetría en tiempo real y gestión de dispositivos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">Espacio:</span>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Seleccionar espacio…" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live alert bar */}
      {liveAlerts.length > 0 && (
        <AlertUI className="border-orange-200 bg-orange-50">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-orange-700 font-medium">
              🔴 {liveAlerts.length} alerta(s) activa(s) recibida(s) en vivo
            </span>
            <Button variant="ghost" size="sm" onClick={() => setLiveAlerts([])} className="text-xs text-orange-600">
              Limpiar
            </Button>
          </AlertDescription>
        </AlertUI>
      )}

      {selectedId ? (
        <Tabs defaultValue="twin">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="twin">Digital Twin</TabsTrigger>
            <TabsTrigger value="telemetry">Telemetría</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="twin" className="mt-4">
            <div className="mb-3">
              <h2 className="font-semibold text-stone-700">
                {selectedSpace?.name ?? selectedId}
              </h2>
              <p className="text-xs text-stone-400">Estado deseado vs. reportado</p>
            </div>
            <TwinPanel spaceId={selectedId} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="telemetry" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-stone-700">
                  Historial de telemetría — últimas 60 ventanas de 1 min
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TelemetryCharts spaceId={selectedId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-stone-700">Alertas del espacio</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertsPanel spaceId={selectedId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center text-stone-400 py-16">Selecciona un espacio para ver su dashboard</div>
      )}
    </div>
  )
}
