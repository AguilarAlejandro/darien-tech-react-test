'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { spacesApi, locationsApi } from '@/lib/api'
import type { Space, Location, CreateSpaceDto, SpaceType } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

const TYPES: SpaceType[] = ['SALA_REUNION', 'ESCRITORIO', 'OFICINA_PRIVADA']
const TYPE_LABELS: Record<SpaceType, string> = {
  SALA_REUNION: 'Sala de reunión',
  ESCRITORIO: 'Escritorio',
  OFICINA_PRIVADA: 'Oficina privada',
}

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
    type: initial?.type ?? 'ESCRITORIO',
    capacity: initial?.capacity ?? 1,
    hourlyRate: initial?.hourlyRate ?? 0,
    active: initial?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        <Select value={form.locationId} onValueChange={(v) => setForm((f) => ({ ...f, locationId: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar lugar…" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as SpaceType }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Capacidad</Label>
          <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} required />
        </div>
        <div className="space-y-1">
          <Label>Tarifa/hora ($)</Label>
          <Input type="number" min={0} step="0.01" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: Number(e.target.value) }))} required />
        </div>
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

  const fetchAll = useCallback(async () => {
    try {
      const [sp, loc] = await Promise.all([spacesApi.list(), locationsApi.list()])
      setSpaces(sp)
      setLocations(loc)
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleCreate(dto: CreateSpaceDto) {
    await spacesApi.create(dto)
    toast.success('Espacio creado')
    setCreating(false)
    fetchAll()
  }

  async function handleUpdate(dto: CreateSpaceDto) {
    if (!editing) return
    await spacesApi.update(editing.id, dto)
    toast.success('Espacio actualizado')
    setEditing(null)
    fetchAll()
  }

  async function handleToggle(space: Space) {
    // Optimistic update
    setSpaces((prev) =>
      prev.map((e) => (e.id === space.id ? { ...e, active: !space.active } : e))
    )
    try {
      await spacesApi.update(space.id, { active: !space.active })
      toast.success(space.active ? 'Espacio desactivado' : 'Espacio activado')
    } catch {
      toast.error('Error al actualizar — revirtiendo…')
      setSpaces((prev) =>
        prev.map((e) => (e.id === space.id ? { ...e, active: space.active } : e))
      )
    }
  }

  const filtered = filterLocation === '__all__' ? spaces : spaces.filter((e) => e.locationId === filterLocation)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Espacios</h1>
          <p className="text-sm text-stone-500 mt-0.5">Escritorios, salas y oficinas</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filterLocation} onValueChange={setFilterLocation}>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead className="text-right">Cap.</TableHead>
                  <TableHead className="text-right">$/hora</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead className="w-32" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-stone-400 py-8">No hay espacios</TableCell>
                  </TableRow>
                )}
                {filtered.map((e) => (
                  <TableRow key={e.id} className="hover:bg-stone-50">
                    <TableCell className="font-medium text-stone-800">
                      <Link href={`/dashboard/spaces/${e.id}`} className="hover:text-teal-600 hover:underline">
                        {e.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-stone-600 text-sm">{TYPE_LABELS[e.type]}</TableCell>
                    <TableCell className="text-stone-500 text-sm">
                      {locations.find((l) => l.id === e.locationId)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-stone-600">{e.capacity}</TableCell>
                    <TableCell className="text-right text-stone-600">${e.hourlyRate}</TableCell>
                    <TableCell>
                      <Badge className={e.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-stone-100 text-stone-500 hover:bg-stone-100'}>
                        {e.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
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
                          <Button variant="ghost" size="sm" className={e.active ? 'text-stone-500' : 'text-emerald-600'} onClick={() => handleToggle(e)}>
                            {e.active ? 'Desactivar' : 'Activar'}
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
    </div>
  )
}
