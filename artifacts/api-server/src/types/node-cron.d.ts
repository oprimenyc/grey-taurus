declare module "node-cron" {
  interface ScheduleOptions {
    timezone?: string;
    scheduled?: boolean;
  }

  interface ScheduledTask {
    start(): void;
    stop(): void;
    destroy(): void;
  }

  function schedule(
    expression: string,
    func: () => void,
    options?: ScheduleOptions,
  ): ScheduledTask;

  function validate(expression: string): boolean;

  export { schedule, validate };
  export type { ScheduleOptions, ScheduledTask };
}
