type Primitive = string | number | boolean | null | undefined | symbol | bigint;

type JsonPathInternal<T, Prefix extends string> = T extends Primitive
  ? Prefix
  : T extends Array<infer U>
    ? Prefix | JsonPath<U, `${Prefix}[${number}]`>
    : {
        [K in keyof T & string]:
          | (Prefix extends '' ? K : `${Prefix}.${K}`)
          | JsonPath<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
      }[keyof T & string];

export type JsonPath<T, Prefix extends string = ''> = Prefix extends '' // If the *root type* is primitive → undefined
  ? T extends Primitive | unknown
    ? undefined | null | string
    : JsonPathInternal<T, Prefix>
  : JsonPathInternal<T, Prefix>;

// Utility type to create a union of error types from an array of constructors
type ErrorUnion<T extends readonly ErrorConstructorLike<any>[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends ErrorConstructorLike<any>
      ? Rest extends readonly ErrorConstructorLike<any>[]
        ? ErrorInstance<First> | ErrorUnion<Rest>
        : ErrorInstance<First>
      : never
    : never;

// Simple conditional type: if it's a readonly tuple (from 'as const'), infer union; otherwise use Error
export type InferErrorType<T> = T extends readonly [
  ErrorConstructorLike<any>,
  ...ErrorConstructorLike<any>[],
]
  ? ErrorUnion<T> // tuple
  : Error; // array

export interface ErrorConstructorLike<T extends Error = Error> {
  new (...args: any[]): T;
}

export type ErrorInstance<T> =
  T extends ErrorConstructorLike<infer U> ? U : never;
