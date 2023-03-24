export function debounce(f: (...args: any) => void, interval: number) {
  let timer: NodeJS.Timeout | null = null;

  return (...args: any) => {
    if (timer) {
      clearTimeout(timer);
    }
    return new Promise((resolve) => {
      timer = setTimeout(
        () => resolve(f(...args)),
        interval,
      );
    });
  };
}