import { Skeleton } from "@/components/ui/skeleton"
import { useBrandColor } from "@/contexts/embed-brand-color-context"

export function WidgetSkeleton() {
  return (
    <div className="h-full w-full bg-white flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}

export function CustomerFormSkeleton() {
  const { brandColor } = useBrandColor();
  
  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b to-white"
        style={{ background: `linear-gradient(to bottom, ${brandColor}, white)` }}
      ></div>
      
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
