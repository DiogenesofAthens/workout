declare module 'node:sqlite' {
  export interface RunResult {
    lastInsertRowid: number | bigint;
    changes: number;
  }

  export class StatementSync {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
    readonly expandedSQL: string;
    readonly sourceSQL: string;
  }

  export class DatabaseSync {
    constructor(location: string, options?: { open?: boolean });
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    close(): void;
  }
}
