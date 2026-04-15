import type { Inert } from "./reactor";

export type Primitive = string | number | boolean | bigint | symbol | null | undefined;
export type NoTraverse =
  | Primitive
  | Function
  | Date
  | Error
  | RegExp
  | Promise<any>
  | Map<any, any>
  | WeakMap<any, any>
  | Set<any>
  | WeakSet<any>
  | HTMLElement
  | Element
  | Node
  | EventTarget
  | Window
  | Document
  | DOMTokenList
  | AbortSignal
  | Inert<unknown>;

/** Dot-path union for traversable keys in `T` up to depth `D{11}`. */
export type Paths<T, S extends string = ".", D extends number = MaxDepth> = [D] extends [0]
  ? never // Circuit Breaker Triggered
  : T extends NoTraverse
  ? never
  : T extends readonly (infer U)[]
  ? `${Extract<keyof T, number>}` | `${Extract<keyof T, number>}${S}${Paths<U, S, PrevDepth[D]>}`
  : {
      [K in keyof T & (string | number)]: T[K] extends Primitive
        ? `${K}`
        : `${K}` | `${K}${S}${Paths<T[K], S, PrevDepth[D]>}`;
    }[keyof T & (string | number)];
/** Wildcard path (`*`) or concrete dot-path. */
export type WildPaths<T, S extends string = "."> = "*" | Paths<T, S>;
/** Child-path expansion for a path up to relative depth `D{x}`. */
export type ChildPaths<
  T,
  P extends WildPaths<T>,
  S extends string = ".",
  D extends number = MaxDepth
> = P extends "*"
  ? Paths<T, S>
  : [D] extends [AllDepth] // hardcoded since already at ts deep limits
  ? Extract<Paths<T, S, AddDepth<PathDepth<P, S>, D>>, `${P}${S}${string}`>
  : Extract<Paths<T, S, AddDepth<PathDepth<P, S>, D>>, `${P}${S}${string}`>;

/** Leaf key name extracted from a path. */
export type PathKey<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? keyof T & (string | number) // Or: DeepKeys<T>
  : PathLeaf<P, S>; // Loose since reactor just slices strings
/** Strict leaf key validated against actual object structure. */
export type StrictPathKey<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? keyof T & (string | number) // Or: DeepKeys<T>
  : P extends `${infer K}${S}${infer Rest}`
  ? K extends keyof T
    ? StrictPathKey<T[K], Rest, S>
    : never
  : P extends keyof T
  ? P
  : never;

/** Value type at path `P` in `T`. */
export type PathValue<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? any // Or: DeepValues<T>
  : P extends `${infer K}${S}${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest, S>
    : never
  : P extends keyof T
  ? T[P]
  : never;

/** Parent-branch value type for path `P` in `T`. */
export type PathBranchValue<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? any // Or: DeepValues<T>
  : P extends `${string}${S}${string}`
  ? PathValue<T, PathBranch<P, S>, S>
  : T;

/** Converts flattened dotted-key objects into nested object with preserved value types. */
export type Unflatten<T extends object, S extends string = "."> = UnionToIntersection<
  {
    [K in keyof T & string]: UnflattenKey<K, T[K], S>;
  }[keyof T & string]
>;
type UnflattenKey<
  K extends string,
  V,
  S extends string
> = K extends `${infer Head}${S}${infer Tail}`
  ? { [P in Head]: UnflattenKey<Tail, V, S> }
  : { [P in K]: V };

// --- Helpers ---

/** Calculates the depth of a dot-separated path with a max of D{11}. */
export type PathDepth<P extends string, S extends string = ".", D extends number = MaxDepth> = [
  D
] extends [0]
  ? 0
  : P extends `${infer _}${S}${infer Rest}`
  ? NextDepth[PathDepth<Rest, S, PrevDepth[D]>]
  : 1;

/** Last segment of a path. */
export type PathLeaf<
  P extends string,
  S extends string = "."
> = P extends `${infer _Head}${S}${infer Tail}` ? PathLeaf<Tail, S> : P;

/** Path without its last segment. */
export type PathBranch<
  P extends string,
  S extends string = "."
> = P extends `${infer Head}${S}${infer Tail}`
  ? Tail extends `${string}${S}${string}`
    ? `${Head}${S}${PathBranch<Tail, S>}`
    : Head
  : never;

/** Converts a union of types into an intersection of types. */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/** Adds two depths together, respecting the max depth{11}. */
export type AddDepth<A extends number, B extends number> = [B] extends [0]
  ? A
  : [A] extends [MaxDepth]
  ? MaxDepth
  : AddDepth<NextDepth[A], PrevDepth[B]>;

/** Subtracts depth B from A, respecting the min depth{0}. */
export type SubtractDepth<A extends number, B extends number> = [B] extends [0]
  ? A
  : [A] extends [0]
  ? 0
  : SubtractDepth<PrevDepth[A], PrevDepth[B]>;

// --- "It's not that deep" WARRIORS ---

/** Deep key union of `T` up to depth `D{11}`. */
export type DeepKeys<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends NoTraverse
  ? never
  : T extends readonly any[]
  ? DeepKeys<T[number], PrevDepth[D]>
  : {
      [K in keyof T & (string | number)]: K | DeepKeys<T[K], PrevDepth[D]>;
    }[keyof T & (string | number)];

/** Recursive merge result type for `T1` and `T2` up to depth `D{11}`. */
export type DeepMerge<T1, T2, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T2 extends object
  ? T1 extends object
    ? {
        [K in keyof T1 | keyof T2]: K extends keyof T2
          ? K extends keyof T1
            ? DeepMerge<T1[K], T2[K], PrevDepth[D]>
            : T2[K]
          : K extends keyof T1
          ? T1[K]
          : never;
      }
    : T2
  : T2;

/** Recursive partial type up to depth `D{11}`. */
export type DeepPartial<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends Function
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U, PrevDepth[D]>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U, PrevDepth[D]>>
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P], PrevDepth[D]> }
  : T;

/** Recursive required type up to depth `D{11}`. */
export type DeepRequired<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends Function
  ? T
  : T extends Array<infer U>
  ? Array<DeepRequired<U, PrevDepth[D]>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepRequired<U, PrevDepth[D]>>
  : T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P], PrevDepth[D]> }
  : T;

// --- RECURSION LIMITERS ---

/** Config for defining recursive limits for all parts of the application */
export interface DepthConfig {
  max: 11;
  all: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19; // observed bundler recursive limit for state trees
  prev: [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  next: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
}
/** Current recursive depth limit */
export type MaxDepth = DepthConfig["max"];
export type AllDepth = DepthConfig["all"];
export type PrevDepth = DepthConfig["prev"];
export type NextDepth = DepthConfig["next"];
