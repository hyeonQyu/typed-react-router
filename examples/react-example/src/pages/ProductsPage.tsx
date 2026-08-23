import { RouteInspector } from '../components/RouteInspector';
import { code, Section, subtleLink, Value } from '../components/ui';
import { TypedLink, useTypedRouter, useTypedSearchParams } from '../routes';

export const ProductsPage = () => {
  // Validated and coerced by the route's Zod schema — not a cast.
  const searchParams = useTypedSearchParams('/products');
  const router = useTypedRouter();

  return (
    <>
      <RouteInspector />

      <Section title="useTypedSearchParams('/products')">
        <Value label="page" value={searchParams.page} />
        <Value label="sort" value={searchParams.sort} />
        <Value label="inStock" value={searchParams.inStock} />
        <Value label="tags" value={searchParams.tags} />
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
          The green labels are runtime <code>typeof</code> results. <code>?page=2</code> arrives as a{' '}
          <strong>number</strong> and <code>?inStock=true</code> as a <strong>boolean</strong>, because the schema says
          so.
        </p>
      </Section>

      <Section title="Try it">
        <TypedLink href="/products" searchParams={{ page: 2, inStock: true }} style={subtleLink}>
          ?page=2&amp;inStock=true
        </TypedLink>
        <TypedLink href="/products" searchParams={{ tags: ['sale', 'new'] }} style={subtleLink}>
          repeated ?tags
        </TypedLink>
        <TypedLink href="/products" searchParams={{ sort: 'price-desc' }} style={subtleLink}>
          ?sort=price-desc
        </TypedLink>
        <button
          type="button"
          style={{ ...subtleLink, border: 0, cursor: 'pointer' }}
          onClick={() => router.push('/products', { searchParams: { page: (searchParams.page ?? 1) + 1 } })}
        >
          router.push → next page
        </button>
      </Section>

      <Section title="What the compiler rejects">
        <div style={code}>
          {[
            "router.push('/products', { searchParams: { page: 'two' } })   // page must be a number",
            "router.push('/products', { searchParams: { sort: 'cheap' } }) // not in the enum",
            "router.push('/products', { searchParams: { pge: 1 } })        // unknown key",
            "router.push('/products', { params: { id: 1 } })               // no dynamic segments here",
          ].join('\n')}
        </div>
      </Section>
    </>
  );
};
