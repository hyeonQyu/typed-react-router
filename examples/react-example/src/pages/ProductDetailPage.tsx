import { RouteInspector } from '../components/RouteInspector';
import { Section, subtleLink, Value } from '../components/ui';
import { TypedLink, useTypedParams } from '../routes';

export const ProductDetailPage = () => {
  const params = useTypedParams('/products/[id]');

  return (
    <>
      <RouteInspector />

      <Section title="useTypedParams('/products/[id]')">
        <Value label="id" value={params.id} />
      </Section>

      <Section title="Links that require this param">
        <TypedLink href="/products/[id]" params={{ id: 7 }} style={subtleLink}>
          Product 7
        </TypedLink>
        <TypedLink href="/products/[id]/reviews" params={{ id: params.id }} searchParams={{ star: 4 }} style={subtleLink}>
          Reviews (4★)
        </TypedLink>
      </Section>
    </>
  );
};
