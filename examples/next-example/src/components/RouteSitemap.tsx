import { routes } from '../routes';
import { Section, Value } from './ui';

/**
 * `routes.paths` gives the pathnames; `routes.collected` gives each route's metadata
 * with it, still typed. `route.metadata.title` needs no cast, and renaming `title`
 * in the tree stops this file from compiling — which is the whole point.
 */
export const RouteSitemap = () => (
  <Section title="A sitemap generated from routes.collected">
    {routes.collected.map((route) => (
      <Value key={route.path} label={route.path} value={route.metadata.title} />
    ))}
    <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
      Every entry is one member of a union discriminated by <code>path</code>, so narrowing on{' '}
      <code>route.path</code> gives you that route&apos;s own metadata — a field only some routes declare cannot be read
      blindly.
    </p>
  </Section>
);
