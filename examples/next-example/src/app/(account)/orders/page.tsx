import { RouteInspector } from '../../../components/RouteInspector';
import { Section } from '../../../components/ui';

export default function OrdersPage() {
  return (
    <>
      <RouteInspector />
      <Section title="Also inside the (account) group">
        <p style={{ fontSize: 14, margin: 0 }}>
          Reachable at <code>/orders</code>. Grouping is a tree concern, not a URL concern.
        </p>
      </Section>
    </>
  );
}
