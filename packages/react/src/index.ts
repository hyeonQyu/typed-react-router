import { createAppRoutes as coreCreateAppRoutes } from '@hyeonqyu/typed-router-core/routes.utils';
import { ReactNode } from 'react';

export const createAppRoutes = <TMetadata extends { component: ReactNode }, TContext>() => coreCreateAppRoutes<TMetadata, TContext>();

export * from '@hyeonqyu/typed-router-core';
