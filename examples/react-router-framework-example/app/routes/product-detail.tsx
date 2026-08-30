import { useLocation } from 'react-router';
import { routes } from '../../src/routes';
import { Section, Value } from '../ui';

export default function ProductDetail() {
  const { pathname } = useLocation();

  /**
   * `match` resolves the live URL back to the route it was declared as, and `parseParams`
   * applies each segment's `paramSchema`. `[id]` declared `z.number()`, so `id` reads back
   * as the number 42 rather than the string "42" — the same coercion the adapter's
   * `useTypedParams` performs, reached through the framework's own location hook.
   */
  const matched = routes.match(pathname);
  const params = matched ? routes.parseParams('/products/[id]', matched.params) : undefined;

  return (
    <Section title="match(pathname) + parseParams('/products/[id]')">
      <Value label="declared pathname" value={matched?.path} />
      <Value label="params.id" value={params?.id} />
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
        <code>typeof params.id</code> is <code>{typeof params?.id}</code>, because the segment declared{' '}
        <code>z.number()</code>. Framework mode&apos;s own <code>useParams()</code> would have given you a string.
      </p>
    </Section>
  );
}
