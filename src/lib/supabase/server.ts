import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CookieOptions } from '@supabase/ssr';

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            // @ts-ignore - cookies() type is incorrect
            return cookies().get(name)?.value;
          } catch {
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // @ts-ignore - cookies() type is incorrect
            cookies().set({ name, value, ...options });
          } catch {
            // Ignore errors when running in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // @ts-ignore - cookies() type is incorrect
            cookies().set({ name, value: '', ...options });
          } catch {
            // Ignore errors when running in middleware
          }
        },
      },
    }
  );
}