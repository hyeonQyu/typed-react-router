'use client';

import { Suspense } from 'react';
import { RouteInspector } from '../../components/RouteInspector';
import { Section, subtleLink, Value } from '../../components/ui';
import { TypedLink, useTypedSearchParams } from '../../routes';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchView />
    </Suspense>
  );
}

function SearchView() {
  // `onError: 'default'` keeps whatever still validates instead of throwing —
  // useful when users hand-edit the URL.
  const searchParams = useTypedSearchParams('/search', { onError: 'default' });

  return (
    <>
      <RouteInspector />

      <Section title="A route whose schema has a required field">
        <Value label="q" value={searchParams.q} />
        <Value label="category" value={searchParams.category} />
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
          Because <code>q</code> is required in the schema, <code>searchParams</code> is a <em>required</em> argument
          for this route — <code>router.push(&apos;/search&apos;)</code> does not compile.
        </p>
      </Section>

      <Section title="Try an invalid category">
        <TypedLink href="/search" searchParams={{ q: 'laptop', category: 'books' }} style={subtleLink}>
          valid: category=books
        </TypedLink>
        <a href="/search?q=laptop&category=toys" style={subtleLink}>
          hand-edited: category=toys
        </a>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
          The second link bypasses the types. With <code>onError: &apos;default&apos;</code> the invalid{' '}
          <code>category</code> is dropped and <code>q</code> survives.
        </p>
      </Section>
    </>
  );
}
