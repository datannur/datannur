declare module '*.png' {
  const value: string
  export default value
}
declare module '*.css' {
  const value: string
  export default value
}
declare module '*.scss' {
  const value: string
  export default value
}
declare module '*.md?raw' {
  const value: string
  export default value
}
declare module '*.js' {
  const value: unknown
  export default value
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

declare module '*.json' {
  const value: JsonValue
  export default value
}
