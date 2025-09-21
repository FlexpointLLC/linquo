import { Skeleton } from "@/components/ui/skeleton"
import { useBrandColor } from "@/contexts/brand-color-context";

export function WidgetSkeleton() {
  const { brandColor } = useBrandColor();
  return (
    <div className="h-full w-full relative overflow-hidden text-gray-900 flex flex-col">
      {/* Gradient Background - same as widget */}
      <div 
        className="absolute inset-0 bg-gradient-to-b to-white"
        style={{ 
          background: `linear-gradient(to bottom, ${brandColor}, white)` 
        }}
      ></div>
      {/* Header skeleton */}
      <div className="relative z-10 bg-gray-50/80 border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
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

      {/* Content area skeleton */}
      <div className="relative z-10 flex-1 p-4 space-y-4">
        {/* Welcome messages skeleton */}
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Loading message */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
      
      {/* Input skeleton */}
      <div className="relative z-10 flex-shrink-0 border-t border-gray-200 bg-white/90 p-3">
        <div className="relative">
          <Skeleton className="w-full h-12 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function CustomerFormSkeleton() {
  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-white"></div>
      
      {/* Close Button skeleton */}
      <div className="absolute top-4 right-4 z-10">
        <Skeleton className="w-5 h-5" />
      </div>
      
      {/* Content skeleton */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Header Text skeleton */}
        <div style={{ paddingTop: 'calc(var(--spacing) * 24)', paddingLeft: '16px', paddingRight: '16px' }}>
          <Skeleton className="h-8 w-32 mb-2 bg-white/30" />
          <Skeleton className="h-8 w-40 bg-white/50" />
        </div>
        
        {/* Form skeleton */}
        <div className="space-y-4">
          <Skeleton className="w-full h-12 rounded-lg" />
          <Skeleton className="w-full h-12 rounded-lg" />
        </div>
        
        {/* Button skeleton */}
        <div className="space-y-3" style={{ paddingTop: 'calc(var(--spacing) * 68)' }}>
          <Skeleton className="w-full h-12 rounded-lg" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    </div>
  )
}
