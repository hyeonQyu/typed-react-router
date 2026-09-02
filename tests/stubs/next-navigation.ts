/**
 * Stands in for `next/navigation` under vitest, via an alias in `vitest.config.mts`.
 *
 * The real hooks assert that an App Router is mounted, which a unit test cannot provide.
 * Aliasing rather than `vi.mock` is deliberate: the repo installs `next` twice (once at
 * the root, once under `packages/next`), so a specifier mocked from a test file is not
 * the specifier the adapter resolves — an alias binds both to this one module.
 *
 * Everything the adapter does *with* these three values is what the tests exercise.
 */
import { vi } from 'vitest';

/** The live URL, as the mocked hooks report it. */
export const location = {
  pathname: '/',
  searchParams: new URLSearchParams(),
};

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

/** Points the mocked hooks at `url`, e.g. `/products/42?sort=desc`. */
export const setLocation = (url: string): void => {
  const [pathname, search = ''] = url.split('?');
  location.pathname = pathname;
  location.searchParams = new URLSearchParams(search);
};

export const usePathname = (): string => location.pathname;
export const useSearchParams = (): URLSearchParams => location.searchParams;
export const useRouter = (): typeof router => router;
