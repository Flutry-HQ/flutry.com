export interface WaitOptions {
  timeout?: number;
  interval?: number;
}

const DEFAULT_OPTIONS: Required<WaitOptions> = {
  timeout: 10000, // 10 sec
  interval: 100, // 100ms
};

export const waitForContext = <T extends Record<string, any>>(context: T, condition: keyof T, options: WaitOptions = {}): Promise<void> => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (context[condition]) {
        //console.log(`${String(condition)} finished`);
        resolve();
        return;
      }
      if (Date.now() - startTime >= config.timeout) {
        reject(new Error(`Context condition '${String(condition)}' timeout after ${config.timeout}ms`));
        return;
      }

      setTimeout(checkCondition, config.interval);
    };

    checkCondition();
  });
};
