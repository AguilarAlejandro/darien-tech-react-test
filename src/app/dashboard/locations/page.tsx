'use client'

import { useState, useEffect, useCallback } from 'react'
import { locationsApi } from '@/lib/api'
import type { Location, CreateLocationDto } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { createLocationSchema } from '@/lib/schemas'

function LocationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<CreateLocationDto>
  onSave: (dto: CreateLocationDto) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CreateLocationDto>({
    name: initial?.name ?? '',
    latitude: initial?.latitude ?? 0,
    longitude: initial?.longitude ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    try {
      createLocationSchema.parse(form)
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
        <Label>Nombre</Label>
        <Input className={errors.name ? 'border-red-500' : ''} value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: '' })) }} />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>
      <div className="space-y-1">
        <Label>Latitud</Label>
        <Input type="number" step="any" className={errors.latitude ? 'border-red-500' : ''} value={form.latitude} onChange={(e) => { setForm((f) => ({ ...f, latitude: Number(e.target.value) })); setErrors((er) => ({ ...er, latitude: '' })) }} />
        {errors.latitude && <p className="text-xs text-red-500">{errors.latitude}</p>}
      </div>
      <div className="space-y-1">
        <Label>Longitud</Label>
        <Input type="number" step="any" className={errors.longitude ? 'border-red-500' : ''} value={form.longitude} onChange={(e) => { setForm((f) => ({ ...f, longitude: Number(e.target.value) })); setErrors((er) => ({ ...er, longitude: '' })) }} />
        {errors.longitude && <p className="text-xs text-red-500">{errors.longitude}</p>}
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

export default function LocationsPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const PAGE_SIZE = 10

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const result = await locationsApi.list({ page, pageSize: PAGE_SIZE })
      setLocations(result.data)
      setTotalPages(result.meta.totalPages)
      setTotal(result.meta.total)
    } catch {
      toast.error('Error al cargar lugares')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  async function handleCreate(dto: CreateLocationDto) {
    try {
      await locationsApi.create(dto)
      toast.success('Lugar creado')
      setCreating(false)
      fetchLocations()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; details?: { field: string; message: string }[] } } })?.response?.data
      const raw = data?.message ?? data?.details?.[0]?.message ?? ''
      if (raw.includes('latitude') || raw.includes('Latitude')) {
        toast.error('Latitud fuera de rango (-90 a 90)')
      } else if (raw.includes('longitude') || raw.includes('Longitude')) {
        toast.error('Longitud fuera de rango (-180 a 180)')
      } else if (raw.includes('name')) {
        toast.error('El nombre es requerido')
      } else {
        toast.error(raw || 'Error al crear lugar')
      }
      throw err
    }
  }

  async function handleUpdate(dto: CreateLocationDto) {
    if (!editing) return
    try {
      await locationsApi.update(editing.id, dto)
      toast.success('Lugar actualizado')
      setEditing(null)
      fetchLocations()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; details?: { field: string; message: string }[] } } })?.response?.data
      const raw = data?.message ?? data?.details?.[0]?.message ?? ''
      if (raw.includes('latitude') || raw.includes('Latitude')) {
        toast.error('Latitud fuera de rango (-90 a 90)')
      } else if (raw.includes('longitude') || raw.includes('Longitude')) {
        toast.error('Longitud fuera de rango (-180 a 180)')
      } else if (raw.includes('name')) {
        toast.error('El nombre es requerido')
      } else {
        toast.error(raw || 'Error al actualizar lugar')
      }
      throw err
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await locationsApi.delete(id)
      toast.success('Lugar eliminado')
      fetchLocations()
    } catch {
      toast.error('No se puede eliminar — tiene espacios activos')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Lugares</h1>
          <p className="text-sm text-stone-500 mt-0.5">{total} lugares en total</p>
        </div>
        {isAdmin && (
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                + Nuevo lugar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo lugar</DialogTitle>
              </DialogHeader>
              <LocationForm onSave={handleCreate} onCancel={() => setCreating(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-stone-400 animate-pulse">Cargando…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="text-stone-500 text-xs font-semibold min-w-[260px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Latitud</TableHead>
                  <TableHead>Longitud</TableHead>
                  {isAdmin && <TableHead className="w-28" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-stone-400 py-8">
                      No hay lugares registrados
                    </TableCell>
                  </TableRow>
                )}
                {locations.map((l) => (
                  <TableRow key={l.id} className="hover:bg-stone-50">
                    <TableCell className="text-stone-500 text-xs font-mono break-all">{l.id}</TableCell>
                    <TableCell className="font-medium text-stone-800">{l.name}</TableCell>
                    <TableCell className="text-stone-600">{l.latitude}</TableCell>
                    <TableCell className="text-stone-600">{l.longitude}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog
                            open={editing?.id === l.id}
                            onOpenChange={(o) => !o && setEditing(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-teal-600 hover:text-teal-700"
                                onClick={() => setEditing(l)}
                              >
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar lugar</DialogTitle>
                              </DialogHeader>
                              <LocationForm
                              initial={l}
                              onSave={handleUpdate}
                                onCancel={() => setEditing(null)}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(l.id)}
                            disabled={deleting === l.id}
                          >
                            {deleting === l.id ? '…' : 'Eliminar'}
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
