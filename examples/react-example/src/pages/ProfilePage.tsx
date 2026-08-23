import { RouteInspector } from '../components/RouteInspector';
import { Section } from '../components/ui';

export const ProfilePage = () => (
  <>
    <RouteInspector />
    <Section title="Declared inside a route group">
      <p style={{ fontSize: 14, margin: 0 }}>
        Declared at <code>(account)/profile</code>, served at <code>/profile</code>. The group became a pathless React
        Router layout route — the indigo banner above is its element.
      </p>
    </Section>
  </>
);
