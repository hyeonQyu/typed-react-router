import { buildTypedHref, type TypedLinkHrefObject, type SearchParams } from '@hyeonqyu/typed-router-core';
import { Link } from 'react-router-dom';
import type { ComponentProps, ComponentRef } from 'react';
import { forwardRef } from 'react';

type ReactLinkProps = ComponentProps<typeof Link>;

export type TypedLinkProps<TPathname extends string = string, TRouteTree = unknown> = Omit<ReactLinkProps, 'to'> & {
  to: TPathname | TypedLinkHrefObject<TPathname, TRouteTree>;
};

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
