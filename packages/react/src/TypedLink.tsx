import { buildTypedHref, type SearchParams, type TypedLinkHrefObject } from '@hyeonqyu/typed-router-core';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

export interface TypedLinkProps<TPathname extends string = string, TRouteTree = unknown> extends Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'to'
> {
  to: TPathname | TypedLinkHrefObject<TPathname, TRouteTree>;
}

export const createTypedLink = <TPathname extends string = string, TRouteTree = unknown>() => {
  const TypedLink = forwardRef<ComponentRef<typeof Link>, TypedLinkProps<TPathname, TRouteTree>>((props, ref) => {
    const { to, ...restProps } = props;

    if (typeof to === 'string') {
      return <Link ref={ref} to={to} {...restProps} />;
    }

    const { pathname, searchParams, hash } = to;
    const finalTo = buildTypedHref(pathname as string, searchParams as SearchParams, hash);

    return <Link ref={ref} to={finalTo} {...restProps} />;
  });

  TypedLink.displayName = 'TypedLink';

  return TypedLink;
};
