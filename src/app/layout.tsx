import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrandColorProvider } from "@/contexts/brand-color-context";

export const metadata: Metadata = {
  title: "Linquo",
  description: "Linquo – customer messaging & support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" suppressHydrationWarning={true}>
        <Suspense fallback={<div>Loading...</div>}>
          <BrandColorProvider>
            {children}
            <Toaster richColors position="top-right" />
          </BrandColorProvider>
        </Suspense>
      </body>
    </html>
  );
}
