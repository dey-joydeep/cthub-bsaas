import type { Env } from '../types/env';

export function selectEnv(options: { production?: boolean; dev?: Env; prod?: Env }): Env {
  const { production, dev, prod } = options;
  if (production === true && prod) return prod;
  if (production === false && dev) return dev;
  // Fallback: prefer dev in non-prod, prod in prod
  return production ? (prod as Env) : (dev as Env);
}
