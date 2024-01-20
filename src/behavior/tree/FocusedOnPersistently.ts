import { Task } from "./Task";
import { Persistence, encodeToString } from "../../utils/persistence/Persistence";
import { Restore } from "./Restore";
import { Result } from "./Result";
import { assert } from "chai";
import { StillRunning } from "./StillRunning";

export class FocusedOnPersistently<O, F, T> implements Task<O, F> {
  public readonly structureHash: number;
  private readonly persistence: Persistence<T>;
  private readonly child: Task<O, T>;
  private readonly init: (o: O, fromScope: F) => T | undefined;

  public constructor(persistence: Persistence<T>, init: (o: O, fromScope: F) => T | undefined, child: Task<O, T>) {
    this.child = child;
    this.persistence = persistence;
    this.init = init;
    this.structureHash = 0x17222cb + 0x5591971 * this.child.structureHash;
  }

  public resume(o: O, blackboard: F, pastResult: Restore): Result {
    assert(!pastResult.stack.hasNoMore(), "can't resume if we have none");

    const restoredBlackboard = pastResult.stack.pop<T>(this.persistence);
    const newBlackboard: T | undefined = restoredBlackboard ?? this.init(o, blackboard);
    if (newBlackboard == null) {
      return Result.FAIL;
    }

    return this.pushScopeIfStillRunning(this.child.resume(o, newBlackboard, pastResult), newBlackboard); // in case it is suspended, retain scope...
  }

  public run(o: O, blackboard: F): Result {
    const newBlackboard = this.init(o, blackboard);
    if (newBlackboard == null) {
      return Result.FAIL;
    }

    return this.pushScopeIfStillRunning(this.child.run(o, newBlackboard), newBlackboard); // in case it is suspended, retain scope...
  }

  public toString(): string {
    return `Scoped[${this.child.toString()}]`;
  }

  private pushScopeIfStillRunning(result: Result, newBlackboard: T): Result {
    switch (result) {
      case Result.SUCCESS:
      case Result.FAIL:
        return result;
      default:
        return (result as StillRunning).pushToStack(encodeToString(this.persistence, newBlackboard));
    }
  }
}
