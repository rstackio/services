import type { ErrorConstructorLike, InferErrorType } from '../errors';

type Result<ResponseType, ErrorType> = [ErrorType, null] | [null, ResponseType];

// More precise async detection
// Exclude 'never' from Promise check
type IsPromise<T> = [T] extends [never]
  ? false
  : T extends Promise<unknown>
    ? true
    : false;

export type SafeAction<
  Action extends (...args: any[]) => any,
  ErrorType = Error,
> =
  IsPromise<ReturnType<Action>> extends true
    ? ReturnType<Action> extends Promise<infer ResponseType>
      ? (
          ...args: Parameters<Action>
        ) => Promise<Result<ResponseType, ErrorType>>
      : (...args: Parameters<Action>) => Result<ReturnType<Action>, ErrorType>
    : (...args: Parameters<Action>) => Result<ReturnType<Action>, ErrorType>;

const response = <ResponseType, ErrorType = Error>({
  error,
  data,
}: {
  error?: ErrorType;
  data?: ResponseType;
}): Result<ResponseType, ErrorType> =>
  error ? [error as ErrorType, null] : [null, data as ResponseType];

const isPromise = <PromiseType>(
  result: PromiseType,
): result is PromiseType & Promise<unknown> =>
  result instanceof Promise ||
  (typeof result === 'object' &&
    result !== null &&
    typeof (result as { then?: unknown }).then === 'function');

const transformError =
  <TransformedErrorType = Error>(
    transformer: (
      error: Error,
    ) => Promise<TransformedErrorType> | TransformedErrorType,
  ) =>
  (
    error: Error,
  ):
    | Promise<Result<null, TransformedErrorType>>
    | Result<null, TransformedErrorType> => {
    try {
      const transformed = transformer(error);

      if (isPromise(transformed)) {
        return transformed
          .then((value: unknown) =>
            response<null, TransformedErrorType>({
              error: value as TransformedErrorType,
            }),
          )
          .catch((error: TransformedErrorType) => response({ error }));
      }

      return response({ error: transformed as TransformedErrorType });
    } catch (error) {
      return response({ error: error as TransformedErrorType });
    }
  };

const caught = <ErrorType extends Error = Error>(
  error: Error,
  types: readonly ErrorConstructorLike<any>[] = [],
  transformer?: (error: Error) => Promise<ErrorType> | ErrorType,
): Promise<Result<null, ErrorType>> | Result<null, ErrorType> => {
  const returnable =
    !types.length ||
    types.some((type: ErrorConstructorLike<any>) => error instanceof type);
  const transformable =
    transformer !== undefined && typeof transformer === 'function';

  if (returnable) {
    return transformable
      ? transformError(transformer)(error)
      : response({ error: error as ErrorType });
  }

  throw error;
};

export const safe = <
  Action extends (...args: any[]) => unknown,
  ErrorTypes extends
    | readonly ErrorConstructorLike<any>[]
    | ErrorConstructorLike<any>[] = [],
>(
  action: Action,
  errorTypes?: ErrorTypes,
  errorTransformer?: (
    error: Error,
  ) => Promise<InferErrorType<ErrorTypes>> | InferErrorType<ErrorTypes>,
): SafeAction<Action, InferErrorType<ErrorTypes>> =>
  ((...args: Parameters<Action>) => {
    try {
      const result = action(...args);

      if (isPromise(result)) {
        return result
          .then(
            (
              data: unknown,
            ): Result<ReturnType<Action>, InferErrorType<ErrorTypes>> =>
              response({ data: data as ReturnType<Action> }),
          )
          .catch((error: Error) =>
            caught<InferErrorType<ErrorTypes>>(
              error,
              errorTypes ?? [],
              errorTransformer,
            ),
          );
      }

      return response({ data: result });
    } catch (error) {
      return caught<InferErrorType<ErrorTypes>>(
        error as Error,
        errorTypes ?? [],
        errorTransformer,
      );
    }
  }) as SafeAction<Action, InferErrorType<ErrorTypes>>;
