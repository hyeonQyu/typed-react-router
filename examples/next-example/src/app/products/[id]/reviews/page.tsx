'use client';

import { Suspense } from 'react';
import { RouteInspector } from '../../../../components/RouteInspector';
import { Section, Value } from '../../../../components/ui';
import { useTypedParams, useTypedSearchParams } from '../../../../routes';

export default function ReviewsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewsView />
    </Suspense>
  );
}

function ReviewsView() {
  // Three levels deep, behind a dynamic segment — inference still resolves the schema.
  const params = useTypedParams('/products/[id]/reviews');
  const searchParams = useTypedSearchParams('/products/[id]/reviews');

  return (
    <>
      <RouteInspector />

      <Section title="Params and search params on a nested dynamic route">
        <Value label="params.id" value={params.id} />
        <Value label="searchParams.star" value={searchParams.star} />
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
          Path params and search params are separate objects now, so it is always clear which one fills the URL and
          which one fills the query string.
        </p>
      </Section>
    </>
  );
}
