'use client';

import { useCurrentRoute } from '../routes';
import { Section, Value } from './ui';

/**
 * Shows what the library resolved for the live URL. The interesting line is
 * `declared pathname`: on `/products/42` it reads `/products/[id]`, which is the
 * pattern the types are keyed on — v1 returned `null` here for every dynamic route.
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
