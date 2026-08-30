/**
 * Stands in for `next/link` under vitest, via an alias in `vitest.config.mts`.
 *
 * `TypedLink`'s own job is to turn `href` plus `params`/`searchParams`/`hash` into one
 * URL and hand it over. A plain anchor is enough to read back what it handed over, and
 * avoids pulling the App Router runtime into a unit test.
 */
import type { AnchorHTMLAttributes, ReactElement } from 'react';

const Link = ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement => (
  <a href={href} {...rest}>
    {children}
  </a>
);

export default Link;
