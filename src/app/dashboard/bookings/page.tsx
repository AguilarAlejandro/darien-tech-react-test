'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { bookingsApi, spacesApi } from '@/lib/api'
import { createBookingSchema } from '@/lib/schemas'
import type { Booking, CreateBookingDto, Space } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { PaginationControls } from '@/components/shared/PaginationControls'
import toast from 'react-hot-toast'
import { ZodError } from 'zod'

function CreateBookingForm({
  spaces,
  onSave,
  onCancel,
}: {
  spaces: Space[]
  onSave: (dto: CreateBookingDto) => Promise<void>
  onCancel: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    spaceId: '',
    clientEmail: '',
    bookingDate: today,
    startTime: '09:00',
    endTime: '10:00',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    try {
      createBookingSchema.parse(form)
      setErrors({})
      return true
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of err.issues) {
          const key = issue.path[0]?.toString()
          if (key && !fieldErrors[key]) {
            fieldErrors[key] = issue.message
          }
        }
        setErrors(fieldErrors)
      }
      return false
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave({
        spaceId: form.spaceId,
        clientEmail: form.clientEmail,
        bookingDate: new Date(form.bookingDate).toISOString(),
        startTime: new Date(`${form.bookingDate}T${form.startTime}`).toISOString(),
        endTime: new Date(`${form.bookingDate}T${form.endTime}`).toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Espacio</Label>
        <Select value={form.spaceId} onValueChange={(v) => { setForm((f) => ({ ...f, spaceId: v })); setErrors((e) => ({ ...e, spaceId: '' })) }}>
          <SelectTrigger className={errors.spaceId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Seleccionar espacio…" />
          </SelectTrigger>
          <SelectContent>
            {spaces.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.spaceId && <p className="text-xs text-red-500">{errors.spaceId}</p>}
      </div>
      <div className="space-y-1">
        <Label>Email del cliente</Label>
        <Input type="email" className={errors.clientEmail ? 'border-red-500' : ''} value={form.clientEmail} onChange={(e) => { setForm((f) => ({ ...f, clientEmail: e.target.value })); setErrors((er) => ({ ...er, clientEmail: '' })) }} required />
        {errors.clientEmail && <p className="text-xs text-red-500">{errors.clientEmail}</p>}
      </div>
      <div className="space-y-1">
        <Label>Fecha de reserva</Label>
        <Input type="date" className={errors.bookingDate ? 'border-red-500' : ''} value={form.bookingDate} onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))} required />
        {errors.bookingDate && <p className="text-xs text-red-500">{errors.bookingDate}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Hora inicio</Label>
          <Input type="time" className={errors.startTime ? 'border-red-500' : ''} value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
          {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
        </div>
        <div className="space-y-1">
          <Label>Hora fin</Label>
          <Input type="time" className={errors.endTime ? 'border-red-500' : ''} value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
          {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving || !form.spaceId || !form.clientEmail}>
          {saving ? 'Reservando…' : 'Crear reserva'}
        </Button>
      </div>
    </form>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterEmail, setFilterEmail] = useState('')
  const debouncedEmail = useDebounce(filterEmail, 400)

  const PAGE_SIZE = 10

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, pageSize: PAGE_SIZE }
      if (debouncedEmail) params.clientEmail = debouncedEmail
      const result = await bookingsApi.list(params as Parameters<typeof bookingsApi.list>[0])
      setBookings(result.data)
      setTotal(result.meta.total)
    } catch {
      toast.error('Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedEmail])

  useEffect(() => { fetchBookings() }, [fetchBookings])
  useEffect(() => { spacesApi.list({ page: 1, pageSize: 100 }).then((res) => setSpaces(res.data)).catch(() => {}) }, [])

  async function handleCreate(dto: CreateBookingDto) {
    try {
      await bookingsApi.create(dto)
      toast.success('Reserva creada')
      setCreating(false)
      fetchBookings()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; details?: { field: string; message: string }[] } } })?.response?.data
      const msg = data?.message
      const firstDetail = data?.details?.[0]?.message ?? ''
      const raw = msg ?? firstDetail

      if (raw.includes('conflict') || raw.includes('Schedule conflict')) {
        toast.error('Conflicto de horario — ese espacio ya está reservado')
      } else if (raw.includes('Weekly booking limit')) {
        toast.error('Límite semanal alcanzado (máx. 3 reservas por semana)')
      } else if (raw.includes('startTime must be on or after bookingDate')) {
        toast.error('La hora de inicio debe ser igual o posterior a la fecha de la reserva')
      } else if (raw.includes('endTime must be after startTime')) {
        toast.error('La hora de fin debe ser posterior a la hora de inicio')
      } else if (raw.includes('Invalid email')) {
        toast.error('El correo electrónico del cliente no es válido')
      } else if (raw.includes('spaceId must be a valid UUID') || raw.includes('Space not found')) {
        toast.error('Espacio no válido o no encontrado')
      } else {
        toast.error(raw || 'Error al crear reserva')
      }
      throw err
    }
  }

  async function handleDelete(id: string) {
    // Optimistic remove
    setBookings((prev) => prev.filter((r) => r.id !== id))
    setTotal((prev) => prev - 1)
    try {
      await bookingsApi.delete(id)
      toast.success('Reserva eliminada')
    } catch {
      toast.error('Error al eliminar — recargando…')
      fetchBookings()
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
            className="w-52"
          />
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">+ Nueva reserva</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Crear reserva</DialogTitle></DialogHeader>
              <CreateBookingForm spaces={spaces} onSave={handleCreate} onCancel={() => setCreating(false)} />
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
                  <TableHead>Email</TableHead>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-stone-400 py-8">Sin resultados</TableCell>
                  </TableRow>
                )}
                {bookings.map((r) => {
                  const space = spaces.find((e) => e.id === r.spaceId)
                  return (
                    <TableRow key={r.id} className="hover:bg-stone-50">
                      <TableCell className="text-stone-700 text-sm font-medium">{r.clientEmail}</TableCell>
                      <TableCell className="text-stone-600 text-sm">
                        {space?.name ?? r.spaceId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-stone-600 text-sm">{formatDate(r.bookingDate)}</TableCell>
                      <TableCell className="text-stone-600 text-sm">{formatDate(r.startTime)}</TableCell>
                      <TableCell className="text-stone-600 text-sm">{formatDate(r.endTime)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(r.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
