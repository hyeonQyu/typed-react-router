import routeConfig from '../routes';
import { code, Section, Value } from '../ui';
import { routes } from '../../src/routes';

export default function Home() {
  return (
    <>
      <Section title="What carries over into framework mode, and what does not">
        <p style={{ fontSize: 14, marginTop: 0 }}>
          <strong>Not usable:</strong> <code>toRouteObjects()</code>. It emits <code>element</code> /{' '}
          <code>Component</code> — React elements resolved at runtime — while framework mode&apos;s{' '}
          <code>RouteConfigEntry</code> wants <code>file</code>, a module path it resolves at build time so it can
          code-split each route and generate its types. Same routes, incompatible units.
        </p>
        <p style={{ fontSize: 14, marginBottom: 0 }}>
          <strong>Usable, and the part that matters:</strong> the tree. <code>routes.paths</code>,{' '}
          <code>buildHref</code>, <code>match</code>, <code>parseParams</code>, <code>parseSearchParams</code> and{' '}
          <code>collected</code> all work unchanged, because they never depended on a router. See{' '}
          <code>app/routes.ts</code> for the fifteen-line bridge that builds the framework config from the tree.
        </p>
      </Section>

      <Section title="Every pathname derived from the tree">
        <div style={code}>{routes.paths.join('\n')}</div>
      </Section>

      <Section title="The framework route config the tree generates">
        <div style={code}>{JSON.stringify(routeConfig, null, 2)}</div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 0 }}>
          Plain <code>RouteConfigEntry[]</code> — the same array <code>index()</code> and <code>route()</code> would
          have built by hand, derived from the tree instead so a route is declared in one place.
        </p>
      </Section>

      <Section title="Metadata, still typed per node">
        <Value label="getMetadata('/products')" value={routes.getMetadata('/products').title} />
        <Value label="getMetadata('/products/[id]')" value={routes.getMetadata('/products/[id]').title} />
      </Section>
    </>
  );
}
