import { RouteInspector } from '../components/RouteInspector';
import { Section, subtleLink, Value } from '../components/ui';
import { TypedLink, useTypedParams } from '../routes';

export const DocsPage = () => {
  const params = useTypedParams('/docs/[...slug]');

  return (
    <>
      <RouteInspector />

      <Section title="Catch-all segments keep their declared name">
        <Value label="slug" value={params.slug} />
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
          The generated React Router path is <code>*</code>, but params are read by matching the URL against the tree,
          so this stays <code>slug</code> — the same name the Next.js adapter reports.
        </p>
      </Section>

      <Section title="Try it">
        <TypedLink href="/docs/[...slug]" params={{ slug: ['guide'] }} style={subtleLink}>
          /docs/guide
        </TypedLink>
        <TypedLink href="/docs/[...slug]" params={{ slug: ['guide', 'routing', 'params'] }} style={subtleLink}>
          /docs/guide/routing/params
        </TypedLink>
      </Section>
    </>
  );
};
