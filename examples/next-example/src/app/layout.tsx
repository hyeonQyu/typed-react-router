import type { ReactNode } from 'react';
import { Nav } from '../components/Nav';
import { page } from '../components/ui';

export const metadata = { title: 'typed-router · Next.js example' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f9fafb' }}>
        <main style={page}>
          <h1 style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>typed-router · Next.js</h1>
          <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
            One route tree drives the pathnames, params and search params below.
          </p>
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
}
