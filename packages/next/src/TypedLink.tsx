import { buildTypedHref, type TypedLinkHrefObject, type SearchParams } from '@hyeonqyu/typed-router-core';
import Link from 'next/link';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import { forwardRef } from 'react';

export interface TypedLinkProps<TPathname extends string = string, TRouteTree = unknown>
  extends Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> {
  href: TPathname | TypedLinkHrefObject<TPathname, TRouteTree>;
}

export const createTypedLink = <TPathname extends string = string, TRouteTree = unknown>() => {
  const TypedLink = forwardRef<ComponentRef<typeof Link>, TypedLinkProps<TPathname, TRouteTree>>((props, ref) => {
    const { href, ...restProps } = props;

    if (typeof href === 'string') {
      return <Link ref={ref} href={href} {...restProps} />;
    }

    const { pathname, searchParams, hash } = href;
    const finalHref = buildTypedHref(pathname as string, searchParams as SearchParams, hash);

    return <Link ref={ref} href={finalHref} {...restProps} />;
  });

  TypedLink.displayName = 'TypedLink';

  return TypedLink;
};
