export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-stone-200 rounded" />
          <div className="h-4 w-32 bg-stone-100 rounded mt-2" />
        </div>
        <div className="h-9 w-32 bg-stone-200 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="bg-stone-50 h-10 border-b border-stone-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-stone-100">
            <div className="h-4 w-40 bg-stone-100 rounded" />
            <div className="h-4 w-28 bg-stone-100 rounded" />
            <div className="h-4 w-24 bg-stone-100 rounded" />
            <div className="h-4 w-20 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
