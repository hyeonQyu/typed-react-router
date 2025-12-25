import { QueryParams, toQueryString } from '@hyeonqyu/typed-router-core';
import { useRouter } from 'next/navigation';

type NavigateOptions = {
  scroll?: boolean;
  query?: QueryParams;
};

type PrefetchOptions = Pick<NavigateOptions, 'query'>;

export const createTypedRouter = <TPathname extends string = string>() => {
  const getHrefWithQuery = (href: TPathname, query?: QueryParams) => {
    return `${href}${toQueryString(query ?? {}, { includeQuestionMark: true })}`;
  };

  return () => {
    const router = useRouter();

    return {
      back: router.back,
      forward: router.forward,
      refresh: router.refresh,
      push: (href: TPathname, options?: NavigateOptions) => {
        return router.push(getHrefWithQuery(href, options?.query), options);
      },
      replace: (href: TPathname, options?: NavigateOptions) => {
        return router.replace(getHrefWithQuery(href, options?.query), options);
      },
      prefetch: (href: TPathname, options?: PrefetchOptions) => {
        return router.prefetch(getHrefWithQuery(href, options?.query));
      },
    };
  };
};
