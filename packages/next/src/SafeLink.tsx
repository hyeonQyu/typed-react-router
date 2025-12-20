import Link from 'next/link';
import type { ComponentProps, ComponentRef } from 'react';
import { forwardRef } from 'react';

type NextLinkProps = ComponentProps<typeof Link>;

export type SafeLinkProps<TPathname extends string = string> = Omit<NextLinkProps, 'href'> & {
  href:
    | TPathname
    | {
        pathname: TPathname;
        query?: Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
        hash?: string;
      };
};

export const createSafeLink = <TPathname extends string = string>() => {
  const SafeLink = forwardRef<ComponentRef<typeof Link>, SafeLinkProps<TPathname>>((props, ref) => {
    return <Link ref={ref} {...(props as NextLinkProps)} />;
  });

  SafeLink.displayName = 'SafeLink';

  return SafeLink;
};
