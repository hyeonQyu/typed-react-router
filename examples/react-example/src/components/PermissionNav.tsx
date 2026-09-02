import { resolveMetadata } from '@hyeonqyu/typed-router-core';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes, type AppContext } from '../routes';
import { link, Section, subtleLink } from './ui';

const ROLES: AppContext['role'][] = ['guest', 'member', 'admin'];

/**
 * What a menu needs from a route, once `resolveMetadata` has run.
 *
 * `title` is required because every route in this tree declares one, and asking for at
 * least one field a route certainly has is what lets the whole `collected` union be
 * read through this shape at all. `label` and `accessible` are optional because only
 * some routes declare them — `collected` keeps each route's *own* metadata type, so a
 * field only some routes declare cannot be read blindly off the union.
 *
 * `accessible` is a `boolean` here, not the `(context) => boolean` the tree declared,
 * because resolving is exactly what turned it into one.
 */
type MenuFields = { title: string; label?: string; accessible?: boolean };

/** A pathname with no `[param]` left in it is one a link can navigate to as-is. */
const isNavigable = (path: string) => !path.includes('[');

/**
 * A menu built from the tree rather than written twice.
 *
 * `routes.collected` enumerates every route with its declared metadata; `resolveMetadata`
 * runs the built-in fields against an app context, turning `accessible: (context) => …`
 * into the boolean it evaluates to. Filtering on that boolean is the whole permission
 * check — there is no second list of "routes an admin may see" to drift out of step.
 *
 * Routes that declare no `accessible` are open to everyone, which is why the test is
 * `!== false` rather than a truthiness test.
 */
export const PermissionNav = () => {
  const [role, setRole] = useState<AppContext['role']>('guest');

  const entries = routes.collected.map((route): { path: string; metadata: MenuFields | undefined } => ({
    path: route.path,
    metadata: resolveMetadata(route.metadata, { role }),
  }));

  const visible = entries.filter((entry) => entry.metadata?.accessible !== false && isNavigable(entry.path));
  const hidden = entries.filter((entry) => entry.metadata?.accessible === false);

  return (
    <Section title="A permission-gated menu, from routes.collected + resolveMetadata">
      <div style={{ marginBottom: '0.75rem' }}>
        {ROLES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => setRole(candidate)}
            style={{ ...(candidate === role ? link : subtleLink), border: 0, cursor: 'pointer' }}
          >
            {candidate}
          </button>
        ))}
      </div>

      <div>
        {visible.map((entry) => (
          // A plain `Link`, not `TypedLink`: `entry.path` came out of the tree at runtime,
          // so there is no literal here for the compiler to check it against.
          <Link key={entry.path} to={entry.path} style={subtleLink}>
            {entry.metadata?.label ?? entry.metadata?.title ?? entry.path}
          </Link>
        ))}
      </div>

      <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
        As <code>{role}</code>: {hidden.length === 0 ? 'nothing is hidden' : `${hidden.map((entry) => entry.path).join(', ')} hidden`}.{' '}
        <code>/orders</code> is admin-only and <code>/profile</code> needs any signed-in role — both declared on the
        tree, not here. Routes with a <code>[param]</code> are left out because a menu has no value to fill it with.
      </p>
    </Section>
  );
};
