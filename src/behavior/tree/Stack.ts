export class Stack {
  private readonly stack: any[];

  constructor(stack: any[]) {
    this.stack = stack;
  }

  hasNoMore(): boolean {
    return this.stack.length == 0;
  }

  popInt(): number {
    return this.stack.pop() as number;
  }
}
