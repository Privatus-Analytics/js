// Eleventy ships no type declarations. The tests only need the constructor and write().
declare module '@11ty/eleventy' {
  export default class Eleventy {
    constructor(input?: string, output?: string, options?: Record<string, unknown>)
    write(): Promise<unknown>
  }
}
