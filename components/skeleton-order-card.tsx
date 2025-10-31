export function SkeletonOrderCard() {
  return (
    <div className="w-full bg-white rounded-xl border border-[rgba(55,50,47,0.08)] p-6 space-y-4">
      {/* Customer name skeleton */}
      <div className="h-6 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>

      {/* Email skeleton */}
      <div className="h-4 bg-gray-200 rounded-lg w-2/3 animate-pulse"></div>

      {/* Status badge skeleton */}
      <div className="h-6 bg-gray-200 rounded-full w-1/3 animate-pulse"></div>

      {/* Footer skeleton */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-4 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
      </div>
    </div>
  )
}
