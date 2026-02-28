declare type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

declare type Merge<T1, T2> = Prettify<Omit<T1, keyof T2> & T1>;

declare type Promisify<T, Error = unknown> = {
  // Enhanced catch method with flexible return type
  catch<TResult = never>(
    onrejected?:
      | ((reason: Error) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult>;
} & Promise<T>;
