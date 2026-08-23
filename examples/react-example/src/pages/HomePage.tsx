import { RouteInspector } from '../components/RouteInspector';
import { code, Section } from '../components/ui';
import { routes } from '../routes';

export const HomePage = () => (
  <>
    <RouteInspector />

    <Section title="Every pathname derived from the tree">
      <div style={code}>{routes.paths.join('\n')}</div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 0 }}>
        Note what is <em>not</em> here: <code>/(account)/profile</code> — the route group collapses — and{' '}
        <code>/docs</code>, which has no <code>_metadata</code> and so is not a destination.
      </p>
    </Section>

    <Section title="The React Router config this tree generates">
      <div style={code}>{JSON.stringify(routes.toRouteObjects(), replaceElements, 2)}</div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 0 }}>
        Plain <code>RouteObject[]</code> — see <code>src/App.tsx</code> for how it is composed with a hand-written
        shell, an index redirect and a catch-all.
      </p>
    </Section>
  </>
);

/** React elements do not serialise; show their component name instead. */
const replaceElements = (_key: string, value: unknown) => {
  if (value && typeof value === 'object' && 'type' in value) {
    const type = (value as { type: unknown }).type;
    return `<${typeof type === 'function' ? (type.name || 'Anonymous') : String(type)} />`;
  }
  return value;
};
