import type { RouteArgs, RoutePaths } from '@hyeonqyu/typed-router-core';
import { buildHref } from '@hyeonqyu/typed-router-core';
import Link from 'next/link';
import { forwardRef, type ComponentPropsWithoutRef, type ReactElement, type Ref } from 'react';

type AnchorProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'href'>;

/**
 * `params`, `searchParams` and `hash` sit next to `href` as ordinary props, so the
 * required ones are visible in autocomplete instead of hidden inside an object.
 */
export type TypedLinkProps<TTree, TPath extends string> = AnchorProps & { href: TPath } & RouteArgs<TTree, TPath>;

export const createTypedLink = <TTree,>() => {
  const TypedLink = forwardRef<HTMLAnchorElement, TypedLinkProps<TTree, string>>(function TypedLink(props, ref) {
    const { href, params, searchParams, hash, ...linkProps } = props;

    return <Link {...linkProps} ref={ref} href={buildHref(href, { params, searchParams, hash })} />;
  });

  // forwardRef erases generics; this cast restores per-`href` inference at the call site.
  return TypedLink as unknown as <TPath extends RoutePaths<TTree>>(
    props: TypedLinkProps<TTree, TPath> & { ref?: Ref<HTMLAnchorElement> },
  ) => ReactElement;
};
