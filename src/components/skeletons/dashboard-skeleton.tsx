import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header skeleton */}
        <div className="p-6 border-b border-gray-200">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Navigation skeleton */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* User menu skeleton */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation list skeleton */}
            <div className="lg:col-span-1">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat area skeleton */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className={`flex items-start gap-3 ${index % 2 === 0 ? '' : 'justify-end'}`}>
                        {index % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                        <div className={`rounded-lg p-3 max-w-xs ${index % 2 === 0 ? 'bg-gray-100' : 'bg-blue-600'}`}>
                          <Skeleton className={`h-4 w-32 mb-2 ${index % 2 === 0 ? '' : 'bg-blue-400'}`} />
                          <Skeleton className={`h-3 w-16 ${index % 2 === 0 ? '' : 'bg-blue-400'}`} />
                        </div>
                        {index % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <Skeleton className="w-full h-12 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
