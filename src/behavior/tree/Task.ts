import { Restore } from "./Restore";
import { Result } from "./Result";

export interface Task<O, B> {
  readonly structureHash: number; // large primes generated via https://catonmat.net/tools/generate-random-prime-numbers
  run(o: O, blackboard: B): Result;

  resume(o: O, blackboard: B, pastResult: Restore): Result;
}

export function runOrResume<Receiver, Board>(
  task: Task<Receiver, Board>,
  o: Receiver,
  blackboard: Board,
  prevResult?: Restore
): Result {
  return prevResult == undefined ? task.run(o, blackboard) : task.resume(o, blackboard, prevResult);
}
