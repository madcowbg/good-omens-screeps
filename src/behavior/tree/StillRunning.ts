import { Restore } from "./Restore";
import { Result } from "./Result";
import { Stack } from "./Stack";

export class StillRunning extends Result {
  private readonly stack: any[] = [];

  public pushToStack(i: number): StillRunning {
    this.stack.push(i);
    return this;
  }

  restore(): Restore {
    return new Restore(new Stack(Array.from(this.stack).reverse()));
  }

  public override toString(): string {
    return `Suspended[ExpandingStack[${this.stack}|]]`; // todo replace with an expanding stack
  }
}
