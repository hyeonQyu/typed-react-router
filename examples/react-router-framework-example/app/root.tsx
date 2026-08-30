import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { routes } from '../src/routes';

const page: React.CSSProperties = {
  maxWidth: 880,
  margin: '0 auto',
  padding: '1.5rem 1rem 4rem',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  lineHeight: 1.6,
  color: '#111827',
};

const link: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.7rem',
  borderRadius: 6,
  background: '#f3f4f6',
  color: '#111827',
  textDecoration: 'none',
  fontSize: 14,
  marginRight: 8,
  marginBottom: 8,
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>typed-router · React Router framework mode</title>
        <Meta />
        <Links />
      </head>
      <body>
        <main style={page}>
          <h1 style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            typed-router · React Router framework mode
          </h1>
          <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
            The tree still declares the routes. The framework still compiles them.
          </p>

          <nav style={{ marginBottom: '1.5rem' }}>
            {/*
              Framework mode's own `<Link>`, with `routes.buildHref` filling the segments.
              `buildHref` is type-checked against the tree, so a typo in a pathname or a
              missing param is a compile error even though `<Link to>` takes a string.
            */}
            <Link to={routes.buildHref('/')} style={link}>
              Home
            </Link>
            <Link to={routes.buildHref('/products')} style={link}>
              Products
            </Link>
            <Link to={routes.buildHref('/products', { searchParams: { sort: 'price-asc', page: 2 } })} style={link}>
              Products (sorted, page 2)
            </Link>
            <Link to={routes.buildHref('/products/[id]', { params: { id: 42 } })} style={link}>
              Product 42
            </Link>
            <Link to={routes.buildHref('/docs/[...slug]', { params: { slug: ['guide', 'intro'] } })} style={link}>
              Docs
            </Link>
          </nav>

          {children}
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
