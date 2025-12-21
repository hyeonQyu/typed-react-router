import { useRouter } from 'next/navigation';

export const createTypedRouter = <TPathname extends string = string>() => {
  return () => {
    const router = useRouter();

    return {
      back: router.back,
      forward: router.forward,
      refresh: router.refresh,
      push: (href: TPathname, options?: { scroll?: boolean }) => {
        return router.push(href, options);
      },
      replace: (href: TPathname, options?: { scroll?: boolean }) => {
        return router.replace(href, options);
      },
      prefetch: (href: TPathname) => {
        return router.prefetch(href);
      },
    };
  };
};
