import { isRouteGroup } from '@hyeonqyu/typed-router-core';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * The only thing this module needs from a route tree. Structural on purpose, so
 * `findRouteDrift(routes, …)` accepts a `defineRoutes()` result without dragging
 * the adapter's React types into a Node-only entry point.
 */
export type RoutesLike = {
  paths: readonly string[];
};

/** Extensions Next treats as a page when `pageExtensions` is not configured. */
const DEFAULT_PAGE_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'] as const;

export type FindRouteDriftOptions = {
  /**
   * Pathnames to leave out of the report, as declared pathnames rather than folder
   * names: `'/admin/secret'` for one route, `'/admin/*'` for a route and everything
   * under it. The Next conventions that address no pathname of their own —
   * intercepting routes (`(.)`, `(..)`, `(...)`), private folders (`_folder`),
   * `route.ts`, `default.tsx` — are skipped already and never need listing here.
   */
  ignore?: readonly string[];
  /** Mirrors `next.config.js` `pageExtensions`. Defaults to `['tsx', 'ts', 'jsx', 'js']`. */
  pageExtensions?: readonly string[];
};

export type RouteDriftReport = {
  /** Declared in the tree with no page under `app/` — type-checks, then 404s. */
  missingFromAppDir: string[];
  /** A page under `app/` the tree never declares — live, but absent from `routes.paths`. */
  missingFromTree: string[];
  /** True when both lists are empty. */
  inSync: boolean;
};

/**
 * A parallel route renders into a layout slot, and like a route group it adds no URL
 * segment — but what sits *under* it still does. `dashboard/@team/settings/page.tsx`
 * really is served at `/dashboard/settings`, with no `dashboard/settings/page.tsx`
 * anywhere, so the slot is transparent rather than skipped.
 */
const isParallelSlot = (name: string): boolean => name.startsWith('@');

/** `_folder` opts a subtree out of routing entirely. */
const isPrivateFolder = (name: string): boolean => name.startsWith('_');

/** `(.)photo`, `(..)photo`, `(..)(..)photo`, `(...)photo` — rendered over another route, not at their own path. */
const isIntercepting = (name: string): boolean => /^\(\.{1,3}\)/.test(name);

const isPageFile = (name: string, pageExtensions: readonly string[]): boolean =>
  pageExtensions.some((extension) => name === `page.${extension}`);

/**
 * Every pathname `app/` actually serves, in the same notation the tree uses —
 * Next folder names and tree keys share their syntax (`[id]`, `[...slug]`,
 * `[[...slug]]`, `(group)`), so the two sides compare as plain strings.
 */
const collectAppDirPaths = (appDir: string, pageExtensions: readonly string[]): string[] => {
  const found = new Set<string>();

  const walk = (directory: string, url: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const { name } = entry;
      if (name.startsWith('.') || name === 'node_modules') continue;

      if (entry.isDirectory()) {
        if (isPrivateFolder(name) || isIntercepting(name)) continue;

        const transparent = isRouteGroup(name) || isParallelSlot(name);
        walk(join(directory, name), transparent ? url : `${url}/${name}`);
        continue;
      }

      // `route.ts`, `default.tsx`, `layout.tsx`, `loading.tsx`, … are not pathnames.
      if (isPageFile(name, pageExtensions)) found.add(url === '' ? '/' : url);
    }
  };

  walk(appDir, '');
  return [...found];
};

const isIgnored = (pathname: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => {
    if (!pattern.endsWith('/*')) return pathname === pattern;

    const prefix = pattern.slice(0, -2);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });

/**
 * Compares the routes declared in the tree against the pages that exist under `app/`,
 * and reports the pathnames only one side knows about.
 *
 * ```ts
 * const report = findRouteDrift(routes, 'src/app');
 * if (!report.inSync) console.error(report.missingFromAppDir, report.missingFromTree);
 * ```
 *
 * `appDir` is resolved from the current working directory. Node-only: this module
 * reads the filesystem and is published on its own entry point so `fs` never reaches
 * a browser bundle.
 */
export const findRouteDrift = (routes: RoutesLike, appDir: string, options: FindRouteDriftOptions = {}): RouteDriftReport => {
  const { ignore = [], pageExtensions = DEFAULT_PAGE_EXTENSIONS } = options;
  const root = resolve(appDir);

  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`typed-router: app directory "${appDir}" does not exist (resolved to "${root}").`);
  }

  const declared = new Set(routes.paths);
  const onDisk = new Set(collectAppDirPaths(root, pageExtensions));

  const missingFromAppDir = [...declared].filter((path) => !onDisk.has(path) && !isIgnored(path, ignore)).sort();
  const missingFromTree = [...onDisk].filter((path) => !declared.has(path) && !isIgnored(path, ignore)).sort();

  return {
    missingFromAppDir,
    missingFromTree,
    inSync: missingFromAppDir.length === 0 && missingFromTree.length === 0,
  };
};

const describe = (report: RouteDriftReport, appDir: string): string => {
  const lines = [`typed-router: the route tree and "${appDir}" disagree.`];

  if (report.missingFromAppDir.length > 0) {
    lines.push('  declared in the tree, but no page exists — these type-check and 404 at runtime:');
    lines.push(...report.missingFromAppDir.map((path) => `    ${path}`));
  }

  if (report.missingFromTree.length > 0) {
    lines.push('  a page exists, but the tree never declares it — live, yet missing from routes.paths:');
    lines.push(...report.missingFromTree.map((path) => `    ${path}`));
  }

  return lines.join('\n');
};

export class RouteDriftError extends Error {
  /** The drift that caused the throw, so a caller can inspect it instead of parsing the message. */
  readonly report: RouteDriftReport;

  constructor(report: RouteDriftReport, appDir: string) {
    super(describe(report, appDir));
    this.name = 'RouteDriftError';
    this.report = report;
  }
}

/**
 * Throws {@link RouteDriftError} unless the tree and `app/` declare exactly the same
 * pathnames. Written for a test, where a failure lands in the suite of whoever owns
 * the app rather than blocking everyone's build:
 *
 * ```ts
 * import { assertRoutesMatchAppDir } from '@hyeonqyu/typed-router-next/check';
 * import { routes } from '@/routes';
 *
 * test('the route tree matches src/app', () => {
 *   assertRoutesMatchAppDir(routes, 'src/app');
 * });
 * ```
 */
export const assertRoutesMatchAppDir = (routes: RoutesLike, appDir: string, options?: FindRouteDriftOptions): void => {
  const report = findRouteDrift(routes, appDir, options);
  if (!report.inSync) throw new RouteDriftError(report, appDir);
};
