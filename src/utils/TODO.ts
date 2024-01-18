export function TODO(message: string): never {
  throw new Error(`Not implemented: ${message}`);
}

export function assert(value: boolean, message?: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}
