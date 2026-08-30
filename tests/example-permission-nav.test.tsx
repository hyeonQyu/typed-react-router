// @vitest-environment jsdom

/**
 * The React example's permission-gated menu, rendered.
 *
 * `resolveMetadata` and the `accessible` built-in are documented headline features, so
 * the example that demonstrates them is worth holding to its claim: switching role has
 * to actually change which routes the menu offers. Testing the example rather than a
 * fixture is the point — if the demo stops demonstrating, this fails.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test } from 'vitest';
import { PermissionNav } from '../examples/react-example/src/components/PermissionNav';
import { routes } from '../examples/react-example/src/routes';

afterEach(cleanup);

const mount = () =>
  render(
    <MemoryRouter>
      <PermissionNav />
    </MemoryRouter>,
  );

/** The menu's destinations, as hrefs — the thing a permission check is supposed to change. */
const menu = () =>
  screen
    .getAllByRole('link')
    .map((anchor) => anchor.getAttribute('href'))
    .sort();

// `fireEvent` rather than a raw `.click()`, so the state update lands inside `act`.
const chooseRole = (role: string) => fireEvent.click(screen.getByRole('button', { name: role }));

test('a guest is offered neither the signed-in route nor the admin one', () => {
  mount();
  expect(menu()).toEqual(['/home', '/products', '/search']);
});

test('a member gains /profile but still not /orders', () => {
  mount();
  chooseRole('member');
  expect(menu()).toEqual(['/home', '/products', '/profile', '/search']);
});

test('an admin is offered every route the tree declares as navigable', () => {
  mount();
  chooseRole('admin');
  expect(menu()).toEqual(['/home', '/orders', '/products', '/profile', '/search']);
});

test('routes with a [param] never appear, having no value to fill it with', () => {
  mount();
  chooseRole('admin');
  expect(menu().some((href) => href?.includes('['))).toBe(false);
});

test('the menu is built from the tree, not from a second list beside it', () => {
  // Every href it offers is a pathname the tree declared. A hand-written menu could pass
  // the assertions above and still drift from the tree; one built from it cannot.
  mount();
  chooseRole('admin');

  const navigable = routes.paths.filter((path) => !path.includes('['));
  expect(menu()).toEqual([...navigable].sort());
});
