import type { ErrorConstructorLike } from '../errors';
import { safe } from '../safe';
import {
  buildProvider,
  type ChainedSafe,
  type ChainedUnsafe,
} from './build-provider';
// Safe version with SafeAction wrapper

export const createSafeProvider = <
  Fn extends (...args: any[]) => Promise<any>,
  ErrorTypes extends
    | readonly ErrorConstructorLike<any>[]
    | ErrorConstructorLike<any>[],
>(
  fn: Fn,
  catchTypes?: ErrorTypes,
) => {
  type Result = Awaited<ReturnType<Fn>>;
  type TransformedResult = Result;

  const { execute, createChainMethods } = buildProvider(fn);
  const safeExecute = safe(execute, catchTypes);
  return Object.assign(
    safeExecute,
    createChainMethods(safeExecute),
  ) as ChainedSafe<Result, TransformedResult, Fn, ErrorTypes>;
};

// Regular version without SafeAction wrapper
export const createProvider = <Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
) => {
  type Result = Awaited<ReturnType<Fn>>;
  type TransformedResult = Result;

  const { execute, createChainMethods } = buildProvider(fn);

  return Object.assign(execute, createChainMethods(execute)) as ChainedUnsafe<
    Result,
    TransformedResult,
    Fn
  >;
};
