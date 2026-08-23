import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { Nav } from './components/Nav';
import { card, page } from './components/ui';
import { routes } from './routes';

const Shell = () => (
  <main style={page}>
    <h1 style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>typed-router · React Router</h1>
    <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
      One route tree drives the pathnames, params, search params — and the router config itself.
    </p>
    <Nav />
    <Outlet />
  </main>
);

const NotFound = () => (
  <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2' }}>
    <strong style={{ fontSize: 14 }}>404</strong>
    <p style={{ fontSize: 13, margin: '0.25rem 0 0', color: '#b91c1c' }}>
      A hand-written route, appended after the generated ones.
    </p>
  </div>
);

/**
 * `toRouteObjects()` returns plain `RouteObject[]`, so generation costs no freedom:
 * here it is nested under a hand-written shell and combined with an index redirect
 * and a catch-all that the tree knows nothing about.
 *
 * The zero-config version is simply `createBrowserRouter(routes.toRouteObjects())`.
 */
const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      ...routes.toRouteObjects(),
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
