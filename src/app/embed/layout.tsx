import { Metadata } from 'next'
import { Suspense } from 'react'
import { BrandColorProvider } from '@/contexts/brand-color-context'
import { GradientLoadingFallback } from '@/components/embed/gradient-loading'

export const metadata: Metadata = {
  title: 'Linquo Chat Widget',
  description: 'Embedded chat widget for customer support',
  robots: 'noindex, nofollow',
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full w-full">
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
            background: white;
          }
          #__next {
            height: 100%;
          }
          [data-widget-container] {
            /* Height will be controlled by JavaScript */
          }
        `
      }} />
      <Suspense fallback={<GradientLoadingFallback />}>
        <BrandColorProvider>
          {children}
        </BrandColorProvider>
      </Suspense>
    </div>
  )
}
