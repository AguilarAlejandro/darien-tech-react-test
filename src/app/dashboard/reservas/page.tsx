'use client'

import { useState, useEffect, useCallback } from 'react'
import { reservasApi, espaciosApi } from '@/lib/api'
import type { Reserva, CreateReservaDto, ReservaEstado, Espacio } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import toast from 'react-hot-toast'

const ESTADO_LABELS: Record<ReservaEstado, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
}

const ESTADO_COLORS: Record<ReservaEstado, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  CONFIRMADA: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  CANCELADA: 'bg-red-100 text-red-600 hover:bg-red-100',
  COMPLETADA: 'bg-stone-100 text-stone-500 hover:bg-stone-100',
}

function CreateReservaForm({
  espacios,
  onSave,
  onCancel,
}: {
  espacios: Espacio[]
  onSave: (dto: CreateReservaDto) => Promise<void>
  onCancel: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<CreateReservaDto>({
    espacioId: '',
    usuarioEmail: '',
    usuarioNombre: '',
    fechaInicio: `${today}T09:00`,
    fechaFin: `${today}T10:00`,
    notas: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...form,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  const activeEspacios = espacios.filter((e) => e.activo)

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Espacio</Label>
        <Select value={form.espacioId} onValueChange={(v) => setForm((f) => ({ ...f, espacioId: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar espacio…" />
          </SelectTrigger>
          <SelectContent>
            {activeEspacios.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.nombre} — ${e.tarifaHora}/h</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Nombre</Label>
          <Input value={form.usuarioNombre} onChange={(e) => setForm((f) => ({ ...f, usuarioNombre: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" value={form.usuarioEmail} onChange={(e) => setForm((f) => ({ ...f, usuarioEmail: e.target.value }))} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Inicio</Label>
          <Input type="datetime-local" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Fin</Label>
          <Input type="datetime-local" value={form.fechaFin} onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Textarea value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} rows={2} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving || !form.espacioId}>
          {saving ? 'Reservando…' : 'Crear reserva'}
        </Button>
      </div>
    </form>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterEmail, setFilterEmail] = useState('')
  const [filterEstado, setFilterEstado] = useState<ReservaEstado | '__all__'>('__all__')

  const PAGE_SIZE = 10

  const fetchReservas = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, pageSize: PAGE_SIZE }
      if (filterEmail) params.usuarioEmail = filterEmail
      if (filterEstado !== '__all__') params.estado = filterEstado
      const result = await reservasApi.list(params as Parameters<typeof reservasApi.list>[0])
      setReservas(result.data)
      setTotal(result.meta.total)
    } catch {
      toast.error('Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }, [page, filterEmail, filterEstado])

  useEffect(() => { fetchReservas() }, [fetchReservas])
  useEffect(() => { espaciosApi.list().then(setEspacios).catch(() => {}) }, [])

  async function handleCreate(dto: CreateReservaDto) {
    try {
      await reservasApi.create(dto)
      toast.success('Reserva creada')
      setCreating(false)
      fetchReservas()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (msg?.includes('conflict') || msg?.includes('solapamiento')) {
        toast.error('Conflicto de horario — ese espacio ya está reservado')
      } else if (msg?.includes('límite semanal') || msg?.includes('weekly')) {
        toast.error('Límite semanal alcanzado (máx. 3 reservas por semana)')
      } else {
        toast.error(msg ?? 'Error al crear reserva')
      }
      throw err
    }
  }

  async function handleDelete(id: string) {
    // Optimistic remove
    setReservas((prev) => prev.filter((r) => r.id !== id))
    setTotal((prev) => prev - 1)
    try {
      await reservasApi.delete(id)
      toast.success('Reserva eliminada')
    } catch {
      toast.error('Error al eliminar — recargando…')
      fetchReservas()
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Reservas</h1>
          <p className="text-sm text-stone-500 mt-0.5">{total} reservas en total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Filtrar por email…"
            value={filterEmail}
            onChange={(e) => { setFilterEmail(e.target.value); setPage(1) }}
            className="w-48"
          />
          <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v as ReservaEstado | '__all__'); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              {(Object.keys(ESTADO_LABELS) as ReservaEstado[]).map((k) => (
                <SelectItem key={k} value={k}>{ESTADO_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">+ Nueva reserva</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Crear reserva</DialogTitle></DialogHeader>
              <CreateReservaForm espacios={espacios} onSave={handleCreate} onCancel={() => setCreating(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-stone-400 animate-pulse">Cargando…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-stone-400 py-8">Sin resultados</TableCell>
                  </TableRow>
                )}
                {reservas.map((r) => {
                  const espacio = espacios.find((e) => e.id === r.espacioId)
                  return (
                    <TableRow key={r.id} className="hover:bg-stone-50">
                      <TableCell>
                        <div className="font-medium text-stone-800 text-sm">{r.usuarioNombre}</div>
                        <div className="text-stone-400 text-xs">{r.usuarioEmail}</div>
                      </TableCell>
                      <TableCell className="text-stone-600 text-sm">
                        {espacio?.nombre ?? r.espacioId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-stone-600 text-sm">{formatDate(r.fechaInicio)}</TableCell>
                      <TableCell className="text-stone-600 text-sm">{formatDate(r.fechaFin)}</TableCell>
                      <TableCell>
                        <Badge className={ESTADO_COLORS[r.estado]}>{ESTADO_LABELS[r.estado]}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(r.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  )
}
