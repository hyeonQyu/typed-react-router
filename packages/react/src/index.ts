import { createAppRoutes as coreCreateAppRoutes } from '@hyeonqyu/typed-router-core';
import { ReactNode } from 'react';

export const createAppRoutes = <TMetadata extends { component: ReactNode }, TContext>() => coreCreateAppRoutes<TMetadata, TContext>();

export * from '@hyeonqyu/typed-router-core';
