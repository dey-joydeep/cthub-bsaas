export * from './types/env';
export * from './tokens/app-env.token';
export * from './utils/select-env';

// Admin environments (re-export for convenience)
export * as adminEnvironments from './environments/admin/environment';
export * as adminEnvironmentsProd from './environments/admin/environment.prod';
export * as adminEnvironmentsDebug from './environments/admin/environment.debug';
