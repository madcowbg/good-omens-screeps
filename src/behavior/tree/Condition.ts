import { Restore } from "./Restore";
import { Result } from "./Result";
import { Task } from "./Task";

export class Condition<Receiver, Blackboard> implements Task<Receiver, Blackboard> {
  public readonly test: (o: Receiver, blackboard: Blackboard) => boolean;
  public constructor(test: (o: Receiver, blackboard: Blackboard) => boolean) {
    this.test = test;
  }

  public resume(o: Receiver, blackboard: Blackboard, pastResult: Restore): Result {
    throw new Error("Conditions are not resumable, they cannot suspend.");
  }

  public run(o: Receiver, blackboard: Blackboard): Result {
    return this.test(o, blackboard) ? Result.SUCCESS : Result.FAIL;
  }

  public readonly structureHash: number = 0x22153c1; // all condition have the same hash
}
