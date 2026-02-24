'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Something went wrong</h2>
        <p className="text-stone-500 mb-4 max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.message && (
          <p className="text-sm text-red-500 mb-4 font-mono bg-red-50 px-3 py-2 rounded-lg inline-block">
            {error.message}
          </p>
        )}
      </div>
      <Button onClick={reset} className="bg-teal-600 hover:bg-teal-700 text-white">
        Try again
      </Button>
    </div>
  )
}
