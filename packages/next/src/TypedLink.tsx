import { replaceDynamicSegments, toSearchParamsString, type SearchParams, type SearchParamsForPath } from '@hyeonqyu/typed-router-core';
import Link from 'next/link';
import type { ComponentProps, ComponentRef } from 'react';
import { forwardRef } from 'react';

type NextLinkProps = ComponentProps<typeof Link>;

export type TypedLinkProps<TPathname extends string = string, TRouteTree = unknown> = Omit<NextLinkProps, 'href'> & {
  href:
  | TPathname
  | (TPathname extends infer TPath
    ? {
      pathname: TPath;
      searchParams?: SearchParamsForPath<TRouteTree, TPath & string>;
      hash?: string;
    }
    : never);
};

export const createTypedLink = <TPathname extends string = string, TRouteTree = unknown>() => {
  const TypedLink = forwardRef<ComponentRef<typeof Link>, TypedLinkProps<TPathname, TRouteTree>>((props, ref) => {
    const { href, ...restProps } = props;

    if (typeof href === 'string') {
      return <Link ref={ref} href={href} {...restProps} />;
    }

    const { pathname, searchParams, hash } = href;

    const { pathname: replacedPathname, remainingParams } = replaceDynamicSegments(
      pathname as string,
      searchParams as SearchParams,
    );

    const queryString = toSearchParamsString(remainingParams, { includeQuestionMark: true });
    const finalHref = `${replacedPathname}${queryString}${hash ?? ''}`;

    return <Link ref={ref} href={finalHref} {...restProps} />;
  });

  TypedLink.displayName = 'TypedLink';

  return TypedLink;
};
