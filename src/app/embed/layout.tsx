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
    <html lang="en" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
      </head>
      <body className="light">
        <div style={{ height: '100%' }}>
          <Suspense fallback={<GradientLoadingFallback />}>
            <BrandColorProvider>
              {children}
            </BrandColorProvider>
          </Suspense>
        </div>
      </body>
    </html>
  )
}
