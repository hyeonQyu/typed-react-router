import { assertRoutesMatchAppDir, findRouteDrift, RouteDriftError } from '@hyeonqyu/typed-router-next/check';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { routes as exampleRoutes } from '../examples/next-example/src/routes';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** Materialises an `app/` shape from a list of relative file paths. Contents never matter. */
const appDir = (files: readonly string[]): string => {
  const root = mkdtempSync(join(tmpdir(), 'typed-router-check-'));
  roots.push(root);

  for (const file of files) {
    const full = join(root, file);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, '');
  }

  return root;
};

const tree = (...paths: string[]) => ({ paths });

// --- both directions of drift ---------------------------------------------------

test('reports nothing when the tree and app/ agree', () => {
  const dir = appDir(['home/page.tsx', 'products/[id]/page.tsx']);

  expect(findRouteDrift(tree('/home', '/products/[id]'), dir)).toEqual({
    missingFromAppDir: [],
    missingFromTree: [],
    inSync: true,
  });
});

test('reports a route the tree declares whose page was deleted', () => {
  const dir = appDir(['home/page.tsx']);
  const report = findRouteDrift(tree('/home', '/search'), dir);

  expect(report.missingFromAppDir).toEqual(['/search']);
  expect(report.missingFromTree).toEqual([]);
  expect(report.inSync).toBe(false);
});

test('reports a page in app/ the tree never declares', () => {
  const dir = appDir(['home/page.tsx', 'checkout/page.tsx']);
  const report = findRouteDrift(tree('/home'), dir);

  expect(report.missingFromAppDir).toEqual([]);
  expect(report.missingFromTree).toEqual(['/checkout']);
  expect(report.inSync).toBe(false);
});

test('reports both directions at once, sorted', () => {
  const dir = appDir(['checkout/page.tsx', 'about/page.tsx']);
  const report = findRouteDrift(tree('/search', '/home'), dir);

  expect(report.missingFromAppDir).toEqual(['/home', '/search']);
  expect(report.missingFromTree).toEqual(['/about', '/checkout']);
});

// --- segment syntax the tree and app/ share --------------------------------------

test('route groups contribute no URL segment, on either side', () => {
  const dir = appDir(['(account)/profile/page.tsx', '(account)/orders/page.tsx']);

  expect(findRouteDrift(tree('/profile', '/orders'), dir).inSync).toBe(true);
});

test('dynamic, catch-all and optional catch-all folders compare verbatim', () => {
  const dir = appDir(['products/[id]/page.tsx', 'docs/[...slug]/page.tsx', 'files/[[...path]]/page.tsx']);

  expect(findRouteDrift(tree('/products/[id]', '/docs/[...slug]', '/files/[[...path]]'), dir).inSync).toBe(true);
});

test('a catch-all is not interchangeable with the dynamic segment of the same name', () => {
  const dir = appDir(['docs/[...slug]/page.tsx']);
  const report = findRouteDrift(tree('/docs/[slug]'), dir);

  expect(report.missingFromAppDir).toEqual(['/docs/[slug]']);
  expect(report.missingFromTree).toEqual(['/docs/[...slug]']);
});

// --- Next conventions the tree cannot express must not be reported ---------------

// Verified against `next build`: with only these files, Next's route table lists both
// `/dashboard` and `/dashboard/settings`. A slot adds no segment of its own, but what
// sits under it is a real pathname — so the slot is transparent, not skipped.
test('a parallel route slot adds no URL segment, but its children still do', () => {
  const dir = appDir(['dashboard/page.tsx', 'dashboard/@analytics/page.tsx', 'dashboard/@team/settings/page.tsx']);

  expect(findRouteDrift(tree('/dashboard', '/dashboard/settings'), dir).inSync).toBe(true);
  expect(findRouteDrift(tree('/dashboard'), dir).missingFromTree).toEqual(['/dashboard/settings']);
});

test('a slot page with nothing under it collapses onto its parent', () => {
  const dir = appDir(['dashboard/page.tsx', 'dashboard/@analytics/page.tsx']);

  expect(findRouteDrift(tree('/dashboard'), dir).inSync).toBe(true);
});

test('groups, slots and intercepts compose', () => {
  const dir = appDir(['(marketing)/@promo/deals/page.tsx', 'feed/@modal/(.)photo/page.tsx', 'feed/photo/page.tsx']);

  expect(findRouteDrift(tree('/deals', '/feed/photo'), dir).inSync).toBe(true);
});

test('intercepting routes are skipped', () => {
  const dir = appDir([
    'feed/page.tsx',
    'feed/(.)photo/page.tsx',
    'feed/(..)photo/page.tsx',
    'feed/(..)(..)photo/page.tsx',
    'feed/(...)photo/page.tsx',
  ]);

  expect(findRouteDrift(tree('/feed'), dir).inSync).toBe(true);
});

test('private folders are skipped', () => {
  const dir = appDir(['home/page.tsx', '_components/page.tsx', '_lib/nested/page.tsx']);

  expect(findRouteDrift(tree('/home'), dir).inSync).toBe(true);
});

test('route handlers and the other special files are not pages', () => {
  const dir = appDir([
    'home/page.tsx',
    'api/users/route.ts',
    'dashboard/default.tsx',
    'layout.tsx',
    'loading.tsx',
    'error.tsx',
    'not-found.tsx',
    'template.tsx',
    'global-error.tsx',
    'favicon.ico',
  ]);

  expect(findRouteDrift(tree('/home'), dir).inSync).toBe(true);
});

test('pageExtensions decides what counts as a page', () => {
  const dir = appDir(['home/page.mdx', 'about/page.tsx']);

  // By default `page.mdx` is not a page, so only `/about` exists...
  expect(findRouteDrift(tree('/about'), dir).inSync).toBe(true);
  expect(findRouteDrift(tree('/about', '/home'), dir).missingFromAppDir).toEqual(['/home']);

  // ...and configuring mdx swaps which of the two is routable.
  expect(findRouteDrift(tree('/home'), dir, { pageExtensions: ['mdx'] }).inSync).toBe(true);
  expect(findRouteDrift(tree('/about'), dir, { pageExtensions: ['mdx'] })).toMatchObject({
    missingFromAppDir: ['/about'],
    missingFromTree: ['/home'],
  });
});

// --- the root route --------------------------------------------------------------

test('app/page.tsx is the root route, declared by the empty-string tree key', () => {
  const dir = appDir(['page.tsx', 'home/page.tsx']);

  expect(findRouteDrift(tree('/home'), dir).missingFromTree).toEqual(['/']);
  expect(findRouteDrift(tree('/', '/home'), dir).inSync).toBe(true);
});

// --- ignore ----------------------------------------------------------------------

test('ignore takes exact pathnames and trailing-star prefixes', () => {
  const dir = appDir(['admin/page.tsx', 'admin/users/page.tsx', 'secret/page.tsx']);

  expect(findRouteDrift(tree(), dir, { ignore: ['/secret'] }).missingFromTree).toEqual(['/admin', '/admin/users']);
  expect(findRouteDrift(tree(), dir, { ignore: ['/admin/*', '/secret'] }).inSync).toBe(true);
});

test('ignore silences a declared route with no page too', () => {
  const dir = appDir(['home/page.tsx']);

  expect(findRouteDrift(tree('/home', '/coming-soon'), dir, { ignore: ['/coming-soon'] }).inSync).toBe(true);
});

// --- the assert wrapper ----------------------------------------------------------

test('assertRoutesMatchAppDir stays silent when the two agree', () => {
  const dir = appDir(['home/page.tsx']);

  expect(() => assertRoutesMatchAppDir(tree('/home'), dir)).not.toThrow();
});

test('assertRoutesMatchAppDir throws RouteDriftError carrying the report', () => {
  const dir = appDir(['checkout/page.tsx']);

  try {
    assertRoutesMatchAppDir(tree('/search'), dir);
    expect.unreachable('expected a RouteDriftError');
  } catch (error) {
    expect(error).toBeInstanceOf(RouteDriftError);
    const drift = error as RouteDriftError;
    expect(drift.name).toBe('RouteDriftError');
    expect(drift.report.missingFromAppDir).toEqual(['/search']);
    expect(drift.report.missingFromTree).toEqual(['/checkout']);
    expect(drift.message).toContain('/search');
    expect(drift.message).toContain('/checkout');
  }
});

test('a missing app directory is a thrown error, not an empty report', () => {
  expect(() => findRouteDrift(tree('/home'), 'does/not/exist')).toThrow(/typed-router: app directory/);
});

// --- the real example app --------------------------------------------------------

test('the example app tree matches its own src/app', () => {
  expect(findRouteDrift(exampleRoutes, 'examples/next-example/src/app')).toEqual({
    missingFromAppDir: [],
    missingFromTree: [],
    inSync: true,
  });
});

// --- the entry-point boundary ----------------------------------------------------

test('the main entry never reaches the filesystem module', () => {
  const entry = readFileSync('packages/next/src/index.ts', 'utf8');

  expect(entry).not.toMatch(/['"]\.\/check['"]/);
});
