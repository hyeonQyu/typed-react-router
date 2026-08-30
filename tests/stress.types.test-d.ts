import type { CollectedRouteOf } from '@hyeonqyu/typed-router-core';
import { deepRoutes, wideRoutes, type DeepRoutes, type WideRoutes } from './stress.fixtures';

/**
 * Scale regressions against `stress.fixtures.ts`: 1,260 routes wide, 30 levels
 * deep. The point is that this file keeps *compiling* — enumeration stays typed
 * at width, and depth stays inside the TS2589 ceiling (31 levels as of writing,
 * for `paths` and `collected` alike). Compare machinery costs with:
 *
 *   yarn tsc -p tests/tsconfig.json --extendedDiagnostics
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type WideElem = (typeof wideRoutes.collected)[number];

// The collected union covers exactly the pathname union, 1,260 routes wide.
type _widePathsAlign = Expect<Equal<WideElem['path'], (typeof wideRoutes.paths)[number]>>;

// Metadata stays readable mid-enumeration at this width.
type _wideSpotEntry = Expect<
  Equal<CollectedRouteOf<WideRoutes, '/section1/[id]'>['metadata']['title'], 'Section 1 detail'>
>;
type _wideIconWhereDeclared = Expect<Equal<CollectedRouteOf<WideRoutes, '/section3'>['metadata']['icon'], 'star'>>;

// @ts-expect-error — `/section1` declares no `icon`
type _wideIconWhereNot = CollectedRouteOf<WideRoutes, '/section1'>['metadata']['icon'];

type DeepElem = (typeof deepRoutes.collected)[number];

// 30 levels deep: both machineries resolve without TS2589 and agree with each other.
type _deepPathsAlign = Expect<Equal<DeepElem['path'], (typeof deepRoutes.paths)[number]>>;
type _deepLeafReachable = Expect<
  Equal<Extract<DeepElem, { metadata: { title: 'Level 30' } }>['metadata']['title'], 'Level 30'>
>;

export type {
  _deepLeafReachable,
  _deepPathsAlign,
  _wideIconWhereDeclared,
  _wideIconWhereNot,
  _widePathsAlign,
  _wideSpotEntry,
};
