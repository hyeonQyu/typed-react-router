import { useSearchParams } from 'react-router';
import { routes } from '../../src/routes';
import { Section, Value } from '../ui';

export default function Products() {
  const [searchParams] = useSearchParams();

  /**
   * Framework mode gives you the raw `URLSearchParams`; the tree's schema is what turns
   * it into typed values. `page` comes back as the number 1 when absent, because the
   * schema declared that default — the adapter's `useTypedSearchParams` is doing the
   * same call underneath.
   */
  const query = routes.parseSearchParams('/products', searchParams);

  return (
    <Section title="parseSearchParams('/products', searchParams)">
      <Value label="page" value={query.page} />
      <Value label="sort" value={query.sort} />
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
        The schema lives on the tree, so this route and every link that builds a URL to it
        agree on what <code>sort</code> and <code>page</code> mean.
      </p>
    </Section>
  );
}
