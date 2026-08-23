import { useCurrentRoute } from '../routes';
import { Section, Value } from './ui';

/**
 * Identical to the Next.js example's inspector — same hook, same fields.
 * `declared pathname` reads `/products/[id]` on `/products/42`, not React Router's `:id`.
 */
export const RouteInspector = () => {
  const { pathname, url, metadata, params } = useCurrentRoute();

  return (
    <Section title="Current route">
      <Value label="live url" value={url} />
      <Value label="declared pathname" value={pathname} />
      <Value label="metadata.title" value={metadata?.title} />
      <Value label="params" value={params} />
    </Section>
  );
};
