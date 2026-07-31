export function getStartContext() {
  return null;
}

export function runWithStartContext(ctx: any, fn: any) {
  return typeof fn === "function" ? fn() : fn;
}

export class AsyncLocalStorage {
  getStore() {
    return null;
  }
  run(ctx: any, fn: any) {
    return typeof fn === "function" ? fn() : fn;
  }
}

export default {
  getStartContext,
  runWithStartContext,
  AsyncLocalStorage,
};
