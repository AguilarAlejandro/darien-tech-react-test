'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { espaciosApi, lugaresApi } from '@/lib/api'
import type { Espacio, Lugar, CreateEspacioDto, EspacioTipo } from '@/lib/types'
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

const TIPOS: EspacioTipo[] = ['SALA_REUNION', 'ESCRITORIO', 'OFICINA_PRIVADA']
const TIPO_LABELS: Record<EspacioTipo, string> = {
  SALA_REUNION: 'Sala de reunión',
  ESCRITORIO: 'Escritorio',
  OFICINA_PRIVADA: 'Oficina privada',
}

function EspacioForm({
  initial,
  lugares,
  onSave,
  onCancel,
}: {
  initial?: Partial<CreateEspacioDto>
  lugares: Lugar[]
  onSave: (dto: CreateEspacioDto) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CreateEspacioDto>({
    lugarId: initial?.lugarId ?? '',
    nombre: initial?.nombre ?? '',
    tipo: initial?.tipo ?? 'ESCRITORIO',
    capacidad: initial?.capacidad ?? 1,
    tarifaHora: initial?.tarifaHora ?? 0,
    activo: initial?.activo ?? true,
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
        <Select value={form.lugarId} onValueChange={(v) => setForm((f) => ({ ...f, lugarId: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar lugar…" />
          </SelectTrigger>
          <SelectContent>
            {lugares.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
      </div>
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as EspacioTipo }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Capacidad</Label>
          <Input type="number" min={1} value={form.capacidad} onChange={(e) => setForm((f) => ({ ...f, capacidad: Number(e.target.value) }))} required />
        </div>
        <div className="space-y-1">
          <Label>Tarifa/hora ($)</Label>
          <Input type="number" min={0} step="0.01" value={form.tarifaHora} onChange={(e) => setForm((f) => ({ ...f, tarifaHora: Number(e.target.value) }))} required />
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

export default function EspaciosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [filterLugar, setFilterLugar] = useState<string>('__all__')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Espacio | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [esp, lug] = await Promise.all([espaciosApi.list(), lugaresApi.list()])
      setEspacios(esp)
      setLugares(lug)
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleCreate(dto: CreateEspacioDto) {
    await espaciosApi.create(dto)
    toast.success('Espacio creado')
    setCreating(false)
    fetchAll()
  }

  async function handleUpdate(dto: CreateEspacioDto) {
    if (!editing) return
    await espaciosApi.update(editing.id, dto)
    toast.success('Espacio actualizado')
    setEditing(null)
    fetchAll()
  }

  async function handleToggle(espacio: Espacio) {
    // Optimistic update
    setEspacios((prev) =>
      prev.map((e) => (e.id === espacio.id ? { ...e, activo: !espacio.activo } : e))
    )
    try {
      await espaciosApi.update(espacio.id, { activo: !espacio.activo })
      toast.success(espacio.activo ? 'Espacio desactivado' : 'Espacio activado')
    } catch {
      toast.error('Error al actualizar — revirtiendo…')
      setEspacios((prev) =>
        prev.map((e) => (e.id === espacio.id ? { ...e, activo: espacio.activo } : e))
      )
    }
  }

  const filtered = filterLugar === '__all__' ? espacios : espacios.filter((e) => e.lugarId === filterLugar)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Espacios</h1>
          <p className="text-sm text-stone-500 mt-0.5">Escritorios, salas y oficinas</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filterLugar} onValueChange={setFilterLugar}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los lugares" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los lugares</SelectItem>
              {lugares.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">+ Nuevo espacio</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear espacio</DialogTitle></DialogHeader>
                <EspacioForm lugares={lugares} onSave={handleCreate} onCancel={() => setCreating(false)} />
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
                      <Link href={`/dashboard/espacios/${e.id}`} className="hover:text-teal-600 hover:underline">
                        {e.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-stone-600 text-sm">{TIPO_LABELS[e.tipo]}</TableCell>
                    <TableCell className="text-stone-500 text-sm">
                      {lugares.find((l) => l.id === e.lugarId)?.nombre ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-stone-600">{e.capacidad}</TableCell>
                    <TableCell className="text-right text-stone-600">${e.tarifaHora}</TableCell>
                    <TableCell>
                      <Badge className={e.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-stone-100 text-stone-500 hover:bg-stone-100'}>
                        {e.activo ? 'Activo' : 'Inactivo'}
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
                              <EspacioForm initial={e} lugares={lugares} onSave={handleUpdate} onCancel={() => setEditing(null)} />
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" className={e.activo ? 'text-stone-500' : 'text-emerald-600'} onClick={() => handleToggle(e)}>
                            {e.activo ? 'Desactivar' : 'Activar'}
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
