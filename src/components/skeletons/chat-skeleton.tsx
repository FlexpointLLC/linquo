import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="w-4 h-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-4 h-4" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* Agent message skeleton */}
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Customer message skeleton */}
        <div className="flex items-start gap-3 justify-end">
          <div className="bg-blue-600 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-32 mb-2 bg-blue-400" />
            <Skeleton className="h-3 w-12 bg-blue-400" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        </div>

        {/* Another agent message */}
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
        <div className="relative">
          <Skeleton className="w-full h-12 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
