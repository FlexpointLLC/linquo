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
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: white;
            }
          `
        }} />
      </head>
      <body className="light">
        <Suspense fallback={<GradientLoadingFallback />}>
          <BrandColorProvider>
            {children}
          </BrandColorProvider>
        </Suspense>
      </body>
    </html>
  )
}
