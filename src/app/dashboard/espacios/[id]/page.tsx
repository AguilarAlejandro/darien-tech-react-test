'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { espaciosApi, lugaresApi, reservasApi } from '@/lib/api'
import type { Espacio, Lugar, Reserva } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

const TIPO_LABELS: Record<string, string> = {
  SALA_REUNION: 'Sala de reunión',
  ESCRITORIO: 'Escritorio',
  OFICINA_PRIVADA: 'Oficina privada',
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  CONFIRMADA: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  CANCELADA: 'bg-red-100 text-red-600 hover:bg-red-100',
  COMPLETADA: 'bg-stone-100 text-stone-500 hover:bg-stone-100',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-stone-500 font-medium">{label}</span>
      <span className="text-stone-800 text-right max-w-xs">{value}</span>
    </div>
  )
}

export default function EspacioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [espacio, setEspacio] = useState<Espacio | null>(null)
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const esp = await espaciosApi.get(id)
      setEspacio(esp)
      const [lug, res] = await Promise.all([
        lugaresApi.get(esp.lugarId),
        reservasApi.list({ espacioId: id, pageSize: 10 }),
      ])
      setLugar(lug)
      setReservas(res.data)
    } catch {
      toast.error('No se pudo cargar el espacio')
      router.push('/dashboard/espacios')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-400 animate-pulse">Cargando espacio…</div>
    )
  }

  if (!espacio) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Link href="/dashboard/espacios" className="hover:text-teal-600 hover:underline">
          Espacios
        </Link>
        <span>/</span>
        <span className="text-stone-800 font-medium">{espacio.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{espacio.nombre}</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {lugar?.nombre ?? '—'} · {TIPO_LABELS[espacio.tipo] ?? espacio.tipo}
          </p>
        </div>
        <Badge
          className={
            espacio.activo
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-sm px-3 py-1'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-100 text-sm px-3 py-1'
          }
        >
          {espacio.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-stone-700">Detalles del espacio</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-2" />
            <DetailRow label="ID" value={<span className="font-mono text-xs text-stone-500">{espacio.id}</span>} />
            <Separator />
            <DetailRow label="Tipo" value={TIPO_LABELS[espacio.tipo] ?? espacio.tipo} />
            <Separator />
            <DetailRow label="Capacidad" value={`${espacio.capacidad} persona${espacio.capacidad !== 1 ? 's' : ''}`} />
            <Separator />
            <DetailRow label="Tarifa por hora" value={`$${espacio.tarifaHora}`} />
            <Separator />
            <DetailRow label="Estado" value={
              <Badge className={espacio.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-stone-100 text-stone-500 hover:bg-stone-100'}>
                {espacio.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            } />
            <Separator />
            <DetailRow label="Creado" value={formatDate(espacio.createdAt)} />
            <Separator />
            <DetailRow label="Actualizado" value={formatDate(espacio.updatedAt)} />
          </CardContent>
        </Card>

        {/* Lugar card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-stone-700">Lugar</CardTitle>
          </CardHeader>
          <CardContent>
            {lugar ? (
              <>
                <Separator className="mb-2" />
                <DetailRow label="Nombre" value={lugar.nombre} />
                <Separator />
                <DetailRow label="Dirección" value={lugar.direccion} />
                <Separator />
                <DetailRow label="Ciudad" value={lugar.ciudad} />
                <Separator />
                <DetailRow label="ID" value={<span className="font-mono text-xs text-stone-500">{lugar.id}</span>} />
              </>
            ) : (
              <p className="text-stone-400 text-sm">Sin información del lugar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reservations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-stone-700">Reservas recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Usuario</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-stone-400 py-6">
                    Sin reservas registradas
                  </TableCell>
                </TableRow>
              ) : (
                reservas.map((r) => (
                  <TableRow key={r.id} className="hover:bg-stone-50">
                    <TableCell>
                      <div className="font-medium text-stone-800 text-sm">{r.usuarioNombre}</div>
                      <div className="text-stone-400 text-xs">{r.usuarioEmail}</div>
                    </TableCell>
                    <TableCell className="text-stone-600 text-sm">{formatDate(r.fechaInicio)}</TableCell>
                    <TableCell className="text-stone-600 text-sm">{formatDate(r.fechaFin)}</TableCell>
                    <TableCell>
                      <Badge className={ESTADO_COLORS[r.estado]}>
                        {ESTADO_LABELS[r.estado]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/dashboard/espacios')}>
          ← Volver a espacios
        </Button>
        <Button
          variant="outline"
          className="text-teal-600 border-teal-200 hover:bg-teal-50"
          onClick={() => router.push(`/dashboard/reservas`)}
        >
          Ver todas las reservas
        </Button>
      </div>
    </div>
  )
}
