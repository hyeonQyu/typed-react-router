import { RouteInspector } from '../components/RouteInspector';
import { Section } from '../components/ui';

export const OrdersPage = () => (
  <>
    <RouteInspector />
    <Section title="Also inside the (account) group">
      <p style={{ fontSize: 14, margin: 0 }}>
        Reachable at <code>/orders</code>, sharing the same generated layout route as <code>/profile</code>.
      </p>
    </Section>
  </>
);
