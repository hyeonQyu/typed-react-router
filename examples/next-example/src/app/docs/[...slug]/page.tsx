'use client';

import { RouteInspector } from '../../../components/RouteInspector';
import { Section, subtleLink, Value } from '../../../components/ui';
import { TypedLink, useTypedParams } from '../../../routes';

export default function DocsPage() {
  const params = useTypedParams('/docs/[...slug]');

  return (
    <>
      <RouteInspector />

      <Section title="Catch-all segments keep their declared name">
        <Value label="slug" value={params.slug} />
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
          Params come from matching the URL against the tree, not from the framework, so a catch-all is{' '}
          <code>slug</code> in both adapters — React Router would otherwise call it <code>*</code>.
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
}
