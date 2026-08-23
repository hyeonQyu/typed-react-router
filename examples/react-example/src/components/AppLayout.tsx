import { Outlet } from 'react-router-dom';
import { card } from './ui';

/**
 * Supplied as `_metadata.layout` on the `(account)` route group, so the generator
 * emits a pathless React Router layout route that wraps `/profile` and `/orders`.
 */
export const AppLayout = () => (
  <>
    <div style={{ ...card, background: '#eef2ff', borderColor: '#c7d2fe' }}>
      <strong style={{ fontSize: 14 }}>(account) layout</strong>
      <p style={{ fontSize: 13, margin: '0.25rem 0 0', color: '#4338ca' }}>
        Rendered by a pathless layout route generated from the route group.
      </p>
    </div>
    <Outlet />
  </>
);
