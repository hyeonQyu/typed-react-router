import { buildHref, type RouteArgs, type RoutePaths } from '@hyeonqyu/typed-router-core';
import { forwardRef, type ComponentPropsWithoutRef, type ReactElement, type Ref } from 'react';
import { Link } from 'react-router-dom';

type AnchorProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'to' | 'href'>;

/**
 * Uses `href` rather than React Router's `to`, so the same link markup compiles
 * against both the React and the Next.js adapter.
 */
export type TypedLinkProps<TTree, TPath extends string> = AnchorProps & { href: TPath } & RouteArgs<TTree, TPath>;

export const createTypedLink = <TTree,>() => {
  const TypedLink = forwardRef<HTMLAnchorElement, TypedLinkProps<TTree, string>>(function TypedLink(props, ref) {
    const { href, params, searchParams, hash, ...linkProps } = props;

    return <Link {...linkProps} ref={ref} to={buildHref(href, { params, searchParams, hash })} />;
  });

  // forwardRef erases generics; this cast restores per-`href` inference at the call site.
  return TypedLink as unknown as <TPath extends RoutePaths<TTree>>(
    props: TypedLinkProps<TTree, TPath> & { ref?: Ref<HTMLAnchorElement> },
  ) => ReactElement;
};
