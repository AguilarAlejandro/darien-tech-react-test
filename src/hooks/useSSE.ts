'use client'

import { useEffect, useRef, useCallback } from 'react'
import { sseUrl } from '@/lib/api'
import type { SSETelemetryEvent, SSEAlertEvent, SSETwinUpdateEvent } from '@/lib/types'

interface SSEHandlers {
  onTelemetry?: (e: SSETelemetryEvent) => void
  onAlert?: (e: SSEAlertEvent) => void
  onTwinUpdate?: (e: SSETwinUpdateEvent) => void
}

export function useSSE(apiKey: string | null, handlers: SSEHandlers) {
  const esRef = useRef<EventSource | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const connect = useCallback(() => {
    if (!apiKey || typeof window === 'undefined') return
    if (esRef.current) {
      esRef.current.close()
    }

    const es = new EventSource(sseUrl(apiKey))
    esRef.current = es

    es.addEventListener('telemetry', (e: MessageEvent) => {
      try {
        handlersRef.current.onTelemetry?.(JSON.parse(e.data))
      } catch {}
    })

    es.addEventListener('alert', (e: MessageEvent) => {
      try {
        handlersRef.current.onAlert?.(JSON.parse(e.data))
      } catch {}
    })

    es.addEventListener('twin_update', (e: MessageEvent) => {
      try {
        handlersRef.current.onTwinUpdate?.(JSON.parse(e.data))
      } catch {}
    })

    es.onerror = () => {
      es.close()
      // Reconnect after 5s
      setTimeout(connect, 5000)
    }
  }, [apiKey])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
    }
  }, [connect])
}
