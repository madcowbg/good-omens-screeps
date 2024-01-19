import { Result } from "./Result";
import { StillRunning } from "./StillRunning";
import { Action } from "./Action";
import { Restore } from "./Restore";
import { Decorator } from "./Decorator";
import { assert } from "chai";

function invert(result: Result): Result {
  switch (result) {
    case Result.FAIL:
      return Result.SUCCESS;
    case Result.SUCCESS:
      return Result.FAIL;
    default: {
      assert(result.constructor === StillRunning);
      return result;
    } //
  }
}

export function not<O, B>(child: Action<O, B>): Decorator<O, B> {
  return new Not(child);
}

class Not<O, B> extends Decorator<O, B> {
  constructor(child: Action<O, B>) {
    super(child);
  }

  resume(o: O, blackboard: B, pastResult: Restore): Result {
    return invert(this.child.resume(o, blackboard, pastResult));
  }

  run(o: O, blackboard: B): Result {
    return invert(this.child.run(o, blackboard));
  }
}
