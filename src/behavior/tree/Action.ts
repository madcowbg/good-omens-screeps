import { assert } from "chai";
import { Task } from "./Task";
import { Restore } from "./Restore";
import { Result } from "./Result";

export class Action<Receiver, Board> implements Task<Receiver, Board> {
  public readonly structureHash = 0x4d0a821;

  private readonly action: (o: Receiver, b: Board) => Result;

  public constructor(action: (o: Receiver, b: Board) => Result) {
    this.action = action;
  }

  public resume(o: Receiver, blackboard: Board, pastResult: Restore): Result {
    assert(pastResult.stack.hasNoMore(), "Actions cannot have a stack, they can only suspend.");
    return this.run(o, blackboard);
  }

  public run(o: Receiver, blackboard: Board): Result {
    return this.action(o, blackboard);
  }
}
