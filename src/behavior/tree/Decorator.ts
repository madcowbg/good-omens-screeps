import { Task } from "./Task";
import { stringHash } from "../../utils/StringHash";
import { Restore } from "./Restore";
import { Result } from "./Result";

export abstract class Decorator<O, B> implements Task<O, B> {
  readonly structureHash: number;
  protected readonly child: Task<O, B>;

  constructor(child: Task<O, B>) {
    this.child = child;
    this.structureHash = stringHash(this.constructor.name) + 0x174e7fb + 0x22dfba9 * this.child.structureHash;
  }

  abstract resume(o: O, blackboard: B, pastResult: Restore): Result;

  abstract run(o: O, blackboard: B): Result;
}
