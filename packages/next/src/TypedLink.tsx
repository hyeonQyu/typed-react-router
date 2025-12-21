import Link from 'next/link';
import type { ComponentProps, ComponentRef } from 'react';
import { forwardRef } from 'react';

type NextLinkProps = ComponentProps<typeof Link>;

export type TypedLinkProps<TPathname extends string = string> = Omit<NextLinkProps, 'href'> & {
  href:
    | TPathname
    | {
        pathname: TPathname;
        query?: Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
        hash?: string;
      };
};

export const createTypedLink = <TPathname extends string = string>() => {
  const TypedLink = forwardRef<ComponentRef<typeof Link>, TypedLinkProps<TPathname>>((props, ref) => {
    return <Link ref={ref} {...(props as NextLinkProps)} />;
  });

  TypedLink.displayName = 'TypedLink';

  return TypedLink;
};
