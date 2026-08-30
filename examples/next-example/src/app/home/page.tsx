import { RouteInspector } from '../../components/RouteInspector';
import { RouteSitemap } from '../../components/RouteSitemap';
import { code, Section } from '../../components/ui';
import { routes } from '../../routes';

export default function HomePage() {
  return (
    <>
      <RouteInspector />

      <Section title="Every pathname derived from the tree">
        <div style={code}>{routes.paths.join('\n')}</div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 0 }}>
          Note what is <em>not</em> here: <code>/(account)/profile</code> — the route group collapses — and{' '}
          <code>/docs</code>, which has no <code>_metadata</code> and so is not a destination.
        </p>
      </Section>

      <RouteSitemap />

      <Section title="Server-side href building">
        <div style={code}>
          {[
            `buildHref('/products/[id]', { params: { id: 42 } })`,
            `  → ${routes.buildHref('/products/[id]', { params: { id: 42 } })}`,
            '',
            `buildHref('/products', { searchParams: { sort: 'price-asc', page: 2 } })`,
            `  → ${routes.buildHref('/products', { searchParams: { sort: 'price-asc', page: 2 } })}`,
            '',
            `buildHref('/docs/[...slug]', { params: { slug: ['guide', 'intro'] } })`,
            `  → ${routes.buildHref('/docs/[...slug]', { params: { slug: ['guide', 'intro'] } })}`,
          ].join('\n')}
        </div>
      </Section>
    </>
  );
}
