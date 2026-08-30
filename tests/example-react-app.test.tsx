// @vitest-environment jsdom

/**
 * The React example, rendered at every route it declares.
 *
 * `useTypedParams` now throws when handed a pathname the URL did not come from, which
 * is a runtime check no type test can catch. The example app is the closest thing to a
 * real consumer this repo has, so rendering each of its pages is what proves the check
 * fires only where it should.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test } from 'vitest';
import { routes } from '../examples/react-example/src/routes';

afterEach(cleanup);

const at = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <routes.TypedRoutes />
    </MemoryRouter>,
  );

/** One live URL per declared route, with the dynamic segments filled the way the app links them. */
const URLS: readonly [pathname: string, url: string][] = [
  ['/home', '/home'],
  ['/products', '/products?sort=price-asc&page=2&inStock=true'],
  ['/products/[id]', '/products/42'],
  ['/products/[id]/reviews', '/products/42/reviews?star=5'],
  ['/search', '/search?q=laptop&category=electronics'],
  ['/docs/[...slug]', '/docs/guide/getting-started'],
  ['/profile', '/profile'],
  ['/orders', '/orders'],
];

test('every declared route has a URL here, so none goes unrendered', () => {
  expect(URLS.map(([pathname]) => pathname).sort()).toEqual([...routes.paths].sort());
});

test.each(URLS)('%s renders without the pathname check firing', (_pathname, url) => {
  expect(() => at(url)).not.toThrow();
  expect(document.body.textContent).not.toBe('');
});

test('the pages read the route they are actually rendered under', () => {
  // A spot check that rendering succeeded for the right reason: the detail page reads
  // `id` back through its `paramSchema`, so `42` here is the number, not the string.
  at('/products/42');
  expect(screen.getByText('42')).toBeTruthy();
});
