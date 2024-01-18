import { Result } from "./Result";

export class StillRunning extends Result {
  private readonly stack: any[] = [];

  public pushToStack(i: number): StillRunning {
    this.stack.push(i);
    return this;
  }
}
