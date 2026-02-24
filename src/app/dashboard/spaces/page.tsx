'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { spacesApi, locationsApi } from '@/lib/api'
import type { Space, Location, CreateSpaceDto } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { PaginationControls } from '@/components/shared/PaginationControls'
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
import toast from 'react-hot-toast'
import { ZodError } from 'zod'
import { createSpaceSchema } from '@/lib/schemas'

function SpaceForm({
  initial,
  locations,
  onSave,
  onCancel,
}: {
  initial?: Partial<CreateSpaceDto>
  locations: Location[]
  onSave: (dto: CreateSpaceDto) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CreateSpaceDto>({
    locationId: initial?.locationId ?? '',
    name: initial?.name ?? '',
    capacity: initial?.capacity ?? 1,
    reference: initial?.reference ?? '',
    description: initial?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    try {
      createSpaceSchema.parse(form)
      setErrors({})
      return true
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of err.issues) {
          const key = issue.path[0]?.toString()
          if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
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
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Lugar</Label>
        <Select value={form.locationId} onValueChange={(v) => { setForm((f) => ({ ...f, locationId: v })); setErrors((e) => ({ ...e, locationId: '' })) }}>
          <SelectTrigger className={errors.locationId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Seleccionar lugar…" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.locationId && <p className="text-xs text-red-500">{errors.locationId}</p>}
      </div>
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input className={errors.name ? 'border-red-500' : ''} value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: '' })) }} />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>
      <div className="space-y-1">
        <Label>Referencia (opcional)</Label>
        <Input value={form.reference ?? ''} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <Label>Capacidad</Label>
        <Input type="number" min={1} className={errors.capacity ? 'border-red-500' : ''} value={form.capacity} onChange={(e) => { setForm((f) => ({ ...f, capacity: Number(e.target.value) })); setErrors((er) => ({ ...er, capacity: '' })) }} />
        {errors.capacity && <p className="text-xs text-red-500">{errors.capacity}</p>}
      </div>
      <div className="space-y-1">
        <Label>Descripción (opcional)</Label>
        <Input value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

export default function SpacesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const [spaces, setSpaces] = useState<Space[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filterLocation, setFilterLocation] = useState<string>('__all__')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const PAGE_SIZE = 10

  const fetchSpaces = useCallback(async () => {
    setLoading(true)
    try {
      const params: { page: number; pageSize: number; locationId?: string } = { page, pageSize: PAGE_SIZE }
      if (filterLocation !== '__all__') params.locationId = filterLocation
      const result = await spacesApi.list(params)
      setSpaces(result.data)
      setTotalPages(result.meta.totalPages)
      setTotal(result.meta.total)
    } catch {
      toast.error('Error al cargar espacios')
    } finally {
      setLoading(false)
    }
  }, [page, filterLocation])

  const fetchLocations = useCallback(async () => {
    try {
      const result = await locationsApi.list({ page: 1, pageSize: 100 })
      setLocations(result.data)
    } catch {
      // locations dropdown fails silently
    }
  }, [])

  useEffect(() => { fetchSpaces() }, [fetchSpaces])
  useEffect(() => { fetchLocations() }, [fetchLocations])

  function handleFilterChange(value: string) {
    setFilterLocation(value)
    setPage(1)
  }

  async function handleCreate(dto: CreateSpaceDto) {
    try {
      await spacesApi.create(dto)
      toast.success('Espacio creado')
      setCreating(false)
      fetchSpaces()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; details?: { field: string; message: string }[] } } })?.response?.data
      const raw = data?.message ?? data?.details?.[0]?.message ?? ''
      if (raw.includes('locationId') || raw.includes('Location not found')) {
        toast.error('Lugar no válido o no encontrado')
      } else if (raw.includes('capacity')) {
        toast.error('La capacidad debe ser al menos 1')
      } else if (raw.includes('name')) {
        toast.error('El nombre es requerido')
      } else {
        toast.error(raw || 'Error al crear espacio')
      }
      throw err
    }
  }

  async function handleUpdate(dto: CreateSpaceDto) {
    if (!editing) return
    try {
      await spacesApi.update(editing.id, dto)
      toast.success('Espacio actualizado')
      setEditing(null)
      fetchSpaces()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; details?: { field: string; message: string }[] } } })?.response?.data
      const raw = data?.message ?? data?.details?.[0]?.message ?? ''
      if (raw.includes('locationId') || raw.includes('Location not found')) {
        toast.error('Lugar no válido o no encontrado')
      } else if (raw.includes('capacity')) {
        toast.error('La capacidad debe ser al menos 1')
      } else if (raw.includes('name')) {
        toast.error('El nombre es requerido')
      } else {
        toast.error(raw || 'Error al actualizar espacio')
      }
      throw err
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await spacesApi.delete(id)
      toast.success('Espacio eliminado')
      fetchSpaces()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      const raw = data?.message ?? ''
      if (raw.includes('reservations') || raw.includes('active')) {
        toast.error('No se puede eliminar — el espacio tiene reservas activas')
      } else {
        toast.error(raw || 'Error al eliminar espacio')
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Espacios</h1>
          <p className="text-sm text-stone-500 mt-0.5">{total} espacios en total</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filterLocation} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los lugares" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los lugares</SelectItem>
              {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">+ Nuevo espacio</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear espacio</DialogTitle></DialogHeader>
                <SpaceForm locations={locations} onSave={handleCreate} onCancel={() => setCreating(false)} />
              </DialogContent>
            </Dialog>
          )}
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead className="text-right">Cap.</TableHead>
                  <TableHead>Descripción</TableHead>
                  {isAdmin && <TableHead className="w-40" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {spaces.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-stone-400 py-8">No hay espacios</TableCell>
                  </TableRow>
                )}
                {spaces.map((e) => (
                  <TableRow key={e.id} className="hover:bg-stone-50">
                    <TableCell className="font-medium text-stone-800">
                      <Link href={`/dashboard/spaces/${e.id}`} className="hover:text-teal-600 hover:underline">
                        {e.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-stone-500 text-sm">{e.reference ?? '—'}</TableCell>
                    <TableCell className="text-stone-500 text-sm">
                      {locations.find((l) => l.id === e.locationId)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-stone-600">{e.capacity}</TableCell>
                    <TableCell className="text-stone-500 text-sm truncate max-w-xs">{e.description ?? '—'}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog open={editing?.id === e.id} onOpenChange={(o) => !o && setEditing(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700" onClick={() => setEditing(e)}>
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Editar espacio</DialogTitle></DialogHeader>
                              <SpaceForm initial={e} locations={locations} onSave={handleUpdate} onCancel={() => setEditing(null)} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(e.id)}
                            disabled={deleting === e.id}
                          >
                            {deleting === e.id ? '…' : 'Eliminar'}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
