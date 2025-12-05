export type Paths<TObject, TSplitter extends string, TPrev extends string = ''> =
  | TSplitter
  | {
      [K in keyof TObject & string]: TObject[K] extends object
        ?
            | `${TSplitter}${TPrev extends '' ? K : `${TPrev}${TSplitter}${K}`}`
            | Paths<TObject[K], TSplitter, TPrev extends '' ? K : `${TPrev}${TSplitter}${K}`>
        : `${TSplitter}${TPrev extends '' ? K : `${TPrev}${TSplitter}${K}`}`;
    }[keyof TObject & string];

export type PathValue<T, P extends string, S extends string> = P extends S
  ? T
  : P extends `${S}${infer Rest}`
    ? Rest extends `${infer K}${S}${infer R}`
      ? K extends keyof T
        ? PathValue<T[K], `${S}${R}`, S>
        : never
      : Rest extends keyof T
        ? T[Rest]
        : never
    : never;
