import { RouteInspector } from '../../../components/RouteInspector';
import { Section } from '../../../components/ui';

export default function ProfilePage() {
  return (
    <>
      <RouteInspector />
      <Section title="Declared inside a route group">
        <p style={{ fontSize: 14, margin: 0 }}>
          This page sits at <code>(account)/profile</code> in both the route tree and <code>src/app/</code>, yet its
          pathname is <code>/profile</code>. The group organises the tree without touching the URL.
        </p>
      </Section>
    </>
  );
}
