import { Task } from "./Task";
import { stringHash } from "../../utils/StringHash";
import { Restore } from "./Restore";
import { Result } from "./Result";

export abstract class Composite<O, B> implements Task<O, B> {
  protected readonly children: Task<O, B>[];
  public readonly structureHash: number;

  protected constructor(children: Task<O, B>[]) {
    this.children = children;
    this.structureHash =
      stringHash(this.constructor.name) +
      0x269bbc1 +
      _.sum(_.map(this.children, (it, i) => (i + 1) * it.structureHash));
  }

  abstract resume(o: O, blackboard: B, pastResult: Restore): Result;

  abstract run(o: O, blackboard: B): Result;
}

/*
class Parallel<O, B>(override val children: Array<Task<O, B>>) : Composite<O, B>() {
  constructor(vararg children: Task<O, B>) : this(arrayOf(*children))

  override fun run(o: O, blackboard: B): Result {
    val results = children.map { it.run(o, blackboard) }
    return resultFromChildResults(children.indices) { results[it] }
  }

  override fun resume(o: O, blackboard: B, pastResult: Restore): Result {
    check(!pastResult.stack.hasNoMore()) { "can't resume if we have none" }

    val serializedChildResults = pastResult.stack.popString() // one less...
    check(pastResult.stack.hasNoMore()) { "stack should be empty, children stacks should be deserialized" }
    val suspendedChildren = MapIntToStillRunningPersistence.decodeFullString(serializedChildResults)

    val newResults = suspendedChildren.mapValues { (k, v) ->
      check(k in children.indices) { "task idx=${k} is not available" }
      return@mapValues children[k].resume(o, blackboard, v)
    }

    return resultFromChildResults(newResults.keys) { newResults[it] }
  }

private inline fun resultFromChildResults(indices: Iterable<Int>, results: (Int) -> Result?) =
  if (indices.any { results(it) == Result.FAIL }) {
    Result.FAIL
  } else { // none have failed
    val suspendedReran = indices
      .associateWith { results(it) }
  .filterValues { it?.isImmediate() == false }
  .mapValues { (it.value as StillRunning).restore() }
    if (suspendedReran.isNotEmpty()) {
      StillRunning().pushToStack(MapIntToStillRunningPersistence.encodeToString(suspendedReran))
    } else {
      Result.SUCCESS
    }
  }

  override fun toString(): String = "Parallel[${children.joinToString()}]"

  companion object {
  private val MapIntToStillRunningPersistence: Persistence<Map<Int, Restore>> =
      MapPersistence(SmallPositiveIntPersistence, RestorePersistence)
  }
}
*/
