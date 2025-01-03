declare module 'worker_threads' {
  export const parentPort: any;
  export const workerData: any;
}

declare module 'pino-pretty' {
  const content: any;
  export default content;
}

declare module 'pino-abstract-transport' {
  const content: any;
  export default content;
}

declare module 'fs' {
  export function writeFile(path: string, data: string, callback: (err?: Error) => void): void;
  export function mkdir(path: string, options: { recursive: boolean }, callback: (err?: Error) => void): void;
  export function readFile(path: string, encoding: string, callback: (err?: Error, data?: string) => void): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
}

declare module 'util' {
  export function promisify<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => Promise<any>;
} 