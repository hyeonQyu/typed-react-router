import { usePathname } from 'next/navigation';

export const createTypedPathname = <TPathname extends string = string>() => {
  return () => {
    const pathname = usePathname();
    return pathname as TPathname;
  };
};
