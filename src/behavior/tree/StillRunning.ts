import { Restore } from "./Restore";
import { Result } from "./Result";
import { Stack } from "./Stack";

export class StillRunning extends Result {
  private readonly stack: any[] = [];

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public pushToStack(i: any): StillRunning {
    this.stack.push(i);
    return this;
  }

  public restore(): Restore {
    return new Restore(new Stack(Array.from(this.stack)));
  }

  public override toString(): string {
    return `Suspended[ExpandingStack[${this.stack.toString()}|]]`; // todo replace with an expanding stack
  }
}
