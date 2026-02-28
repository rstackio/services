import type { ErrorConstructorLike, InferErrorType } from '../errors';
import { isMockEnabled } from '../mock';
import type { SafeAction } from '../safe';

type Executor<Fn extends (...args: unknown[]) => Promise<unknown>, Result> = (
  ...args: Parameters<Fn>
) => Promise<Result>;

type ThenFn<V, R> = (value: V) => R;
type CatchFn<Result> = <Err extends Error>(error: Err) => NonNever<Result>;
type FinallyFn = () => void;

type OmitPreserveCall<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
} & (T extends (...args: infer A) => infer R ? (...args: A) => R : object);

type NonNever<T> = T extends never ? never : T;

// Base chained operations interface
export type ChainedSafeOps<
  Result,
  TransformedResult,
  Fn extends (...args: unknown[]) => Promise<unknown>,
> = {
  andThen: <NewTransformedResult>(
    fn: ThenFn<TransformedResult, NewTransformedResult>,
  ) => OmitPreserveCall<
    ChainedSafe<Result, NewTransformedResult, Fn>,
    'andThen'
  >;

  andCatch: (
    fn: CatchFn<TransformedResult>,
  ) => OmitPreserveCall<
    ChainedSafe<Result, TransformedResult, Fn>,
    'andCatch' | 'andThen'
  >;

  andFinally: (
    fn: FinallyFn,
  ) => OmitPreserveCall<
    ChainedSafe<Result, TransformedResult, Fn>,
    'andFinally' | 'andThen' | 'andCatch'
  >;

  andMock: (
    fn: Fn,
  ) => OmitPreserveCall<ChainedSafe<Result, TransformedResult, Fn>, 'andMock'>;
};

// For unsafe version
export type ChainedOpsUnsafe<
  Result,
  TransformedResult,
  Fn extends (...args: unknown[]) => Promise<unknown>,
> = {
  andThen: <NewTransformedResult>(
    fn: ThenFn<TransformedResult, NewTransformedResult>,
  ) => OmitPreserveCall<
    ChainedUnsafe<Result, NewTransformedResult, Fn>,
    'andThen'
  >;

  andCatch: (
    fn: CatchFn<TransformedResult>,
  ) => OmitPreserveCall<
    ChainedUnsafe<Result, TransformedResult, Fn>,
    'andCatch' | 'andThen'
  >;

  andFinally: (
    fn: FinallyFn,
  ) => OmitPreserveCall<
    ChainedUnsafe<Result, TransformedResult, Fn>,
    'andFinally' | 'andThen' | 'andCatch'
  >;

  andMock: (
    fn: Fn,
  ) => OmitPreserveCall<
    ChainedUnsafe<Result, TransformedResult, Fn>,
    'andMock'
  >;
};

// Safe version with SafeAction
export type ChainedSafe<
  Result,
  TransformedResult,
  Fn extends (...args: unknown[]) => Promise<unknown>,
  ErrorTypes extends
    | readonly ErrorConstructorLike<any>[]
    | ErrorConstructorLike<any>[] = [],
> = ChainedSafeOps<Result, TransformedResult, Fn> &
  SafeAction<
    (...args: Parameters<Fn>) => Promise<TransformedResult>,
    InferErrorType<ErrorTypes>
  >;

// Unsafe version with callable signature
export type ChainedUnsafe<
  Result,
  TransformedResult,
  Fn extends (...args: unknown[]) => Promise<unknown>,
> = ChainedOpsUnsafe<Result, TransformedResult, Fn> &
  ((...args: Parameters<Fn>) => Promise<TransformedResult>);

// Core builder that creates the chainable provider
export const buildProvider = <Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
) => {
  type Result = Awaited<ReturnType<Fn>>;
  type TransformedResult = Result;

  let thenFn: ThenFn<Result, TransformedResult> | undefined;
  let catchFn: CatchFn<TransformedResult> | undefined;
  let finallyFn: FinallyFn | undefined;
  let mockFn: Fn | undefined;

  const executor: Executor<Fn, Result> = async (...args) => {
    const provider = isMockEnabled() && mockFn ? mockFn : fn;
    return provider(...args);
  };

  const execute = (...args: Parameters<Fn>) =>
    executor(...args)
      .then((result) => (thenFn ? thenFn(result) : result))
      .catch((error) =>
        catchFn
          ? catchFn(error)
          : (() => {
              throw error;
            })(),
      )
      .finally(() => finallyFn?.());

  const createChainMethods = <
    T extends
      | ((...args: Parameters<Fn>) => Promise<TransformedResult>)
      | SafeAction<(...args: Parameters<Fn>) => Promise<TransformedResult>>,
  >(
    target: T,
  ) => ({
    andCatch: (fn: CatchFn<TransformedResult>) => {
      catchFn = fn;
      return target;
    },
    andFinally: (fn: FinallyFn) => {
      finallyFn = fn;
      return target;
    },
    andMock: (fn: typeof mockFn) => {
      mockFn = fn;
      return target;
    },
    andThen: (fn: ThenFn<Result, TransformedResult>) => {
      thenFn = fn;
      return target;
    },
  });

  // Return both the execute logic and chain methods separately
  return { createChainMethods, execute };
};
