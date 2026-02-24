import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
      <h1 className="text-6xl font-bold text-teal-600">404</h1>
      <h2 className="text-xl font-semibold text-stone-800">Page Not Found</h2>
      <p className="text-stone-500 max-w-md text-center">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard/locations"
        className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
