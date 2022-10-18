export const DEFAULT_MONITOR_INTERVAL = 1_200_000; // 20 minutes

export default class Monitor {
  // Won't run if disabled
  isDisabled: boolean;
  // Monitor is still working but won't send request.
  isRequestDisabled: boolean;
  // Interval in milliseconds
  interval: number;

  onRequest: () => Promise<any>;
  shouldChange: (oldData?: any, newData?: any) => Promise<boolean>;

  // It should run on second interval
  isRunnable: boolean;

  // Save old data to compare with new data
  oldData: any;

  constructor(
    onRequest: () => Promise<any>,
    shouldChange: (oldData?: any, newData?: any) => Promise<boolean>,
  ) {
    this.onRequest = onRequest;
    this.shouldChange = shouldChange;

    this.isDisabled = false;
    this.isRequestDisabled = false;
    this.interval = DEFAULT_MONITOR_INTERVAL;
    this.isRunnable = false;
  }

  // Will override this function
  onMonitorChange() {
    console.log('Method not implemented.');
  }

  run() {
    if (this.isDisabled) return;

    setInterval(async () => {
      if (!this.isRunnable) {
        this.isRunnable = true;

        return;
      }

      if (this.isRequestDisabled) {
        this.onMonitorChange();

        return;
      }

      const data = await this.onRequest();

      const shouldChange = await this.shouldChange(this.oldData, data);

      if (shouldChange) {
        this.onMonitorChange();
      }

      this.oldData = data;
    }, 30000);
  }
}
