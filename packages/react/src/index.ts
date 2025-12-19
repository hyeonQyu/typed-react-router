import { createAppRoutes as coreCreateAppRoutes } from '@typed-react-router/core';
import { ReactNode } from 'react';

export const createAppRoutes = <TMetadata extends { component: ReactNode }, TContext>() => coreCreateAppRoutes<TMetadata, TContext>();

export * from '@typed-react-router/core';
