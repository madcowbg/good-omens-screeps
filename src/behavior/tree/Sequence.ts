import { Task } from "./Task";
import { Result } from "./Result";
import { StillRunning } from "./StillRunning";
import { Restore } from "./Restore";
import { assert } from "../../utils/TODO";
import { Composite } from "./Composite";

export class Sequence<O, B> extends Composite<O, B> {
  public constructor(children: Task<O, B>[]) {
    super(children);
  }

  public override run(o: O, blackboard: B): Result {
    return this.runChildren(o, blackboard, this.children.keys());
  }

  public override resume(o: O, blackboard: B, pastResult: Restore): Result {
    assert(!pastResult.stack.hasNoMore(), "can't resume if we have none");

    const i = pastResult.stack.popInt(); // one less...
    assert(i in this.children.keys(), "task idx=${i} is not available");

    const child = this.children[i];
    const result = child.resume(o, blackboard, pastResult); // resume the suspended child
    switch (result) {
      case Result.FAIL:
        return result;
      case Result.SUCCESS:
        return this.runChildren(o, blackboard, _.range(i + 1, this.children.length).values()); // run the rest
      default:
        return (result as StillRunning).pushToStack(i);
    }
  }

  public override toString(): string {
    return `Sequence[${this.children.toString()}]`;
  }

  private runChildren(o: O, blackboard: B, indices: IterableIterator<number>): Result {
    for (const i of indices) {
      const child = this.children[i];
      const result = child.run(o, blackboard);
      switch (result) {
        case Result.FAIL:
          return result;
        case Result.SUCCESS:
          continue;
        default:
          return (result as StillRunning).pushToStack(i);
      }
    }
    return Result.SUCCESS;
  }
}
