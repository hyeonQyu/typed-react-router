import { useLocation } from 'react-router';
import { routes } from '../../src/routes';
import { Section, Value } from '../ui';

export default function Docs() {
  const { pathname } = useLocation();
  const matched = routes.match(pathname);

  return (
    <Section title="A catch-all keeps the name the tree gave it">
      <Value label="declared pathname" value={matched?.path} />
      <Value label="params.slug" value={matched?.params.slug} />
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0.75rem 0 0' }}>
        The segment is declared <code>[...slug]</code>, so it reads back as <code>slug</code>. Framework mode compiles
        it to <code>*</code> and would have called it <code>&quot;*&quot;</code>.
      </p>
    </Section>
  );
}
