// @vitest-environment jsdom

/**
 * The Next example's client pages, rendered at the URLs they are served from.
 *
 * The counterpart of `example-react-app.test.tsx`: `useTypedParams` now throws when the
 * pathname it is given is not the route the URL came from, and only rendering the real
 * pages proves the example still satisfies its own check. `next/navigation` and
 * `next/link` come from the stubs aliased in `vitest.config.mts`.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import DocsPage from '../examples/next-example/src/app/docs/[...slug]/page';
import ProductDetailPage from '../examples/next-example/src/app/products/[id]/page';
import ReviewsPage from '../examples/next-example/src/app/products/[id]/reviews/page';
import { setLocation } from './stubs/next-navigation';

afterEach(cleanup);

test('the product detail page reads its own route', () => {
  setLocation('/products/42');
  expect(() => render(<ProductDetailPage />)).not.toThrow();

  // `[id]` declares `paramSchema: z.number()`, so this is the number 42, not '42'.
  expect(screen.getByTestId('id').textContent).toBe('42');
});

test('the reviews page reads a route three levels deep, behind a dynamic segment', () => {
  setLocation('/products/42/reviews?star=5');
  expect(() => render(<ReviewsPage />)).not.toThrow();

  expect(screen.getByTestId('params.id').textContent).toBe('42');
  expect(screen.getByTestId('searchParams.star').textContent).toBe('5');
});

test('the docs page keeps the catch-all name the tree gave it', () => {
  setLocation('/docs/guide/getting-started');
  expect(() => render(<DocsPage />)).not.toThrow();

  expect(screen.getByTestId('slug').textContent).toBe('["guide","getting-started"]');
});
