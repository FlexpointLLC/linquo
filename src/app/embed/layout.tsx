import { Metadata } from 'next'

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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
          `
        }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
