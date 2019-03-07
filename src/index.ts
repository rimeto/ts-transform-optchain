/**
 * Copyright (C) 2018-present, Rimeto, LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Transformer export
export { default as transformer } from './transform'

/**
 * Code transformation that converts a ts-transformer-optchain call expression
 * into a logic expression. For example:
 *
 * @example
 *   // Pre-transform
 *   const value = oc(obj).propA.propB.propC(defaultValue);
 *
 *   // Post-transform
 *   const value = (obj != null
 *     && obj.propA != null
 *     && obj.propA.propB != null
 *     && obj.propA.propB.propC != null)
 *       ? obj.propA.propB.propC
 *       : defaultValue;
 *
 *   //
 *   // Other use cases for oc
 *   //
 *
 *   // Given:
 *   const x = oc<T>({
 *     a: 'hello',
 *     b: { d: 'world' },
 *     c: [-100, 200, -300],
 *   });
 *
 *   // Then:
 *   x.a() === 'hello'
 *   x.b.d() === 'world'
 *   x.c[0]() === -100
 *   x.c[100]() === undefined
 *   x.c[100](1234) === 1234
 *   x.c.map((e) => e()) === [-100, 200, -300]
 *   x.d.e() === undefined
 *   x.d.e('optional default value') === 'optional default value'
 */
export declare function oc<T>(data?: T): TSOCType<T>;

/**
 * A generic type that cannot be `undefined`.
 */
export type Defined<T> = Exclude<T, undefined>;

/**
 * Data accessor interface to dereference the value of the `TSOCType`.
 */
export interface TSOCDataAccessor<T> {
  /**
   * Data accessor without a default value. If no data exists,
   * `undefined` is returned.
   */
  (): Defined<T> | undefined;

  /**
   * Data accessor with default value.
   * @param defaultValue
   */
  (defaultValue: NonNullable<T>): NonNullable<T>;

  /**
   * Data accessor with null default value.
   * @param defaultValue
   */
  (nullDefaultValue: T extends null ? null : never): Defined<T>;
}

/**
 * `TSOCObjectWrapper` gives TypeScript visibility into the properties of
 * an `TSOCType` object at compile-time.
 */
export type TSOCObjectWrapper<T> = { [K in keyof T]-?: TSOCType<T[K]> };

/**
 * `TSOCArrayWrapper` gives TypeScript visibility into the `TSOCType` values of an array
 * without exposing Array methods (it is problematic to attempt to invoke methods during
 * the course of an optional chain traversal).
 */
export interface TSOCArrayWrapper<T> {
  length: TSOCType<number>;
  [K: number]: TSOCType<T>;
}

/**
 * `TSOCDataWrapper` selects between `TSOCArrayWrapper`, `TSOCObjectWrapper`, and `TSOCDataAccessor`
 * to wrap Arrays, Objects and all other types respectively.
 */
export type TSOCDataWrapper<T> = T extends any[]
  ? TSOCArrayWrapper<T[number]>
  : T extends object ? TSOCObjectWrapper<T> : TSOCDataAccessor<T>;

/////////////////////////////////////
//
// OCType Definitions
//
////////////////////////////////////

/**
 * An object that supports optional chaining
 */
export type TSOCType<T> = TSOCDataAccessor<T> & TSOCDataWrapper<NonNullable<T>>;
