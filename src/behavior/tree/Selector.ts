import { Task } from "./Task";
import { Result } from "./Result";
import { StillRunning } from "./StillRunning";
import { Restore } from "./Restore";
import { Composite } from "./Composite";
import { assert } from "../../utils/TODO";

export class Selector<O, B> extends Composite<O, B> {
  public constructor(children: Task<O, B>[]) {
    super(children);
  }

  public override run(o: O, blackboard: B): Result {
    return this.runChildren(o, blackboard, this.children.keys());
  }

  public override resume(o: O, blackboard: B, pastResult: Restore): Result {
    assert(!pastResult.stack.hasNoMore(), "can't resume if we have none");

    const i = pastResult.stack.popInt();
    assert(this.children[i] != undefined, "task idx=${i} is not available, has ${children.size} only");
    const child = this.children[i];
    const result = child.resume(o, blackboard, pastResult); // resume the suspended child
    if (result === Result.SUCCESS) {
      return result;
    } else if (result === Result.FAIL) {
      // run the rest
      return this.runChildren(o, blackboard, _.range(i + 1, this.children.length).values());
    } else {
      return (result as StillRunning).pushToStack(i);
    }
  }

  public override toString(): string {
    return `Selector[${this.children.toString()}]`;
  }

  private runChildren(o: O, blackboard: B, indices: IterableIterator<number>): Result {
    for (const i of indices) {
      const child = this.children[i];
      const result = child.run(o, blackboard);
      if (result === Result.SUCCESS) {
        return result;
      } else if (result === Result.FAIL) {
        // continue
      } else {
        return (result as StillRunning).pushToStack(i);
      }
    }
    return Result.FAIL;
  }
}
