import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrandColorProvider } from "@/contexts/brand-color-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/components/auth/auth-provider";

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
    <html lang="en" suppressHydrationWarning={true}>
      <body className="font-sans antialiased">
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider>
            <BrandColorProvider>
              <AuthProvider>
                {children}
                <Toaster richColors position="top-right" />
              </AuthProvider>
            </BrandColorProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
