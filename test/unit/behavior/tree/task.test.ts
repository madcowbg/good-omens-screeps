import { Action } from "../../../../src/behavior/tree/Action";
import { StillRunning } from "../../../../src/behavior/tree/StillRunning";
import { Result } from "../../../../src/behavior/tree/Result";
import { assert } from "chai";
import { Sequence } from "../../../../src/behavior/tree/Sequence";
import { Selector } from "../../../../src/behavior/tree/Selector";
import { not } from "../../../../src/behavior/tree/Not";
import { Task, runOrResume } from "behavior/tree/Task";
import { Restore } from "behavior/tree/Restore";

const successTask = new Action<any, any>((o, b) => Result.SUCCESS);
const failTask = new Action<any, any>((o, b) => Result.FAIL);
const stillRunningTask = new Action<any, any>((o, b) => new StillRunning());
const bad: Result = {};

function hardCodedTaskResults<O, B>(...toReturn: Result[]): Task<O, B> {
  const results = Array.from(toReturn).reverse();
  assert(results.length > 0);
  return new Action((o, b): Result => {
    if (results.length > 1) {
      return results.pop()!;
    } else {
      return results[0];
    }
  });
}

function providedTaskResults<O, B>(...toReturn: ((b: B) => Result)[]): Task<O, B> {
  assert(toReturn.length > 0);
  const results = Array.from(toReturn).reverse();
  return new Action<O, B>((o, d): Result => {
    if (results.length > 1) {
      return results.pop()!(d);
    } else {
      return results[0](d);
    }
  });
}

describe("behavior", () => {
  describe("tree", () => {
    describe("Sequence", () => {
      it("should return failure on running if one is not success", () => {
        assert.equal(Result.SUCCESS, new Sequence([successTask, successTask, successTask]).run(null, null));
        assert.equal(Result.FAIL, new Sequence([successTask, successTask, failTask]).run(null, null));
        assert.equal(Result.FAIL, new Sequence([failTask, successTask, successTask]).run(null, null));
        assert.equal(Result.FAIL, new Sequence([failTask, successTask, stillRunningTask]).run(null, null));
        assert.instanceOf(new Sequence([stillRunningTask, successTask, failTask]).run(null, null), StillRunning);
      });
    });

    describe("Selector", () => {
      it("should return success on first non-failing", () => {
        assert.equal(Result.SUCCESS, new Selector([successTask, successTask, successTask]).run(null, null));
        assert.equal(Result.SUCCESS, new Selector([successTask, successTask, failTask]).run(null, null));
        assert.equal(Result.SUCCESS, new Selector([failTask, successTask, successTask]).run(null, null));
        assert.instanceOf(new Selector([stillRunningTask, successTask, successTask]).run(null, null), StillRunning);
        assert.equal(Result.FAIL, new Selector([failTask, failTask]).run(null, null));
        assert.equal(
          Result.SUCCESS,
          new Selector([failTask, successTask, stillRunningTask, successTask, failTask]).run(null, null)
        );
        assert.instanceOf(new Selector([failTask, stillRunningTask, successTask]).run(null, null), StillRunning);
      });
    });

    describe("Not", () => {
      it("should return the inverse of the underlying result", () => {
        assert.equal(Result.FAIL, not(successTask).run(null, null));
        assert.equal(Result.SUCCESS, not(failTask).run(null, null));
        assert.instanceOf(not(stillRunningTask).run(null, null), StillRunning);
      });
    });

    describe("Task", () => {
      it("should behave like whatever sequence it wraps", () => {
        const tree = hardCodedTaskResults(new StillRunning(), Result.SUCCESS, Result.FAIL);

        assert.equal("[object Object]", tree.toString());
        const res = runOrResume(tree, null, null, undefined);
        assert.equal("Suspended[ExpandingStack[|]]", res.toString());
        const suspendResult: Restore = (res as StillRunning).restore();

        const secondResult = runOrResume(tree, null, null, suspendResult);
        assert.equal(Result.SUCCESS, secondResult);

        const thirdResult = runOrResume(tree, null, null, suspendResult);
        assert.equal(Result.FAIL, thirdResult);
      });

      it("should resume from suspended state at proper step", () => {
        const taskThatSucceedsOnce = hardCodedTaskResults(Result.SUCCESS, bad); // this one won't run
        const stillRunningOnceTask = providedTaskResults(
          _ => new StillRunning(),
          _ => Result.SUCCESS,
          _ => Result.FAIL
        );
        const tree = new Sequence([taskThatSucceedsOnce, stillRunningOnceTask]);
        assert.equal("Sequence[[object Object],[object Object]]", tree.toString());

        const suspendedResult = runOrResume(tree, null, null);
        assert.equal("Suspended[ExpandingStack[1|]]", suspendedResult.toString());
        assert.instanceOf(suspendedResult, StillRunning);

        const secondResult = tree.resume(null, null, (suspendedResult as StillRunning).restore());
        assert.equal(Result.SUCCESS, secondResult, "expected success");

        const thirdResult = tree.resume(null, null, (suspendedResult as StillRunning).restore());
        assert.equal(Result.FAIL, thirdResult, "expected failure");
      });

      it("should resume from suspended state at proper step from a more complex tree", () => {
        const taskThatFailsOnce = hardCodedTaskResults(Result.FAIL, bad); // this one won't run
        const stillRunningOnceTask = providedTaskResults(
          _ => new StillRunning(),
          _ => Result.SUCCESS,
          _ => Result.FAIL
        );
        const tree = new Selector([
          new Sequence([
            new Sequence([]),
            new Selector([new Selector([]), not(taskThatFailsOnce)]),
            new Selector([new Selector([]), stillRunningOnceTask, new Selector([])])
          ])
        ]);

        assert.equal(
          "Selector[Sequence[Sequence[],Selector[Selector[],[object Object]],Selector[Selector[],[object Object],Selector[]]]]",
          tree.toString()
        );

        const suspendedResult = runOrResume(tree, null, null, undefined);
        assert.equal("Suspended[ExpandingStack[1,2,0|]]", suspendedResult.toString());
        assert.instanceOf(suspendedResult, StillRunning);
        const suspendResult = suspendedResult as StillRunning;

        const secondResult = runOrResume(tree, null, null, suspendResult.restore());
        assert.equal(Result.SUCCESS, secondResult);

        const thirdResult = runOrResume(tree, null, null, suspendResult.restore());
        assert.equal(Result.FAIL, thirdResult);
      });
    });
  });
});

/*
package behavior.tree

import screeps.utils.unsafe.jsObject
import utils.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue


external interface DummyData {
    var field1: String
    var field2: Int
}

val dummyPersistence = object : Persistence<DummyData> {
    override fun encode(t: DummyData, b: StringBuilder) {
        StringPersistence.encode(t.field1, b)
        LargeIntPersistence.encode(t.field2, b)
    }

    override fun decode(e: EncodedDataStream): DummyData {
        val f1 = StringPersistence.decode(e)
        val f2 = LargeIntPersistence.decode(e)
        return jsObject { field1 = f1; field2 = f2 }
    }
}


class BehaviorTreeTest {

    @Test
    fun behavior_tree_with_complex_tree_serializes_and_deserializes_correctly() {
        val taskThatFailsOnce = hardCodedTaskResults<Any?, Unit?>(Result.FAIL, bad)// this one won't run
        val dummyObj = jsObject<DummyData> {
            field1 = "ala"; field2 = -54854
        }

        val stillRunningOnceTask =
            providedTaskResults<Any?, DummyData>(
                { _, d ->
                    check(d == dummyObj) { "$d" }
                    StillRunning()
                },
                { _, d ->
                    check(d.field1 == "ala") { "restored field 1 is incorrect as ${d.field1}" }
                    check(d.field2 == -54854) { "restored field 2 is incorrect as ${d.field1}" }
                    Result.SUCCESS
                },
                { _, _ -> Result.FAIL })

        val tree = Selector(
            Sequence(
                Sequence(),
                Selector(
                    Selector(), !taskThatFailsOnce
                ),
                Selector(
                    Selector(),
                    (Scoped<Any?, Unit?, DummyData>(dummyPersistence) { _, _ ->
                        dummyObj
                    } then stillRunningOnceTask),
                    Selector()
                )
            )
        )

        assertEquals(
            "Selector[Sequence[Sequence[], Selector[Selector[], [object Object]], Selector[Selector[], Scoped[[object Object]], Selector[]]]]",
            tree.toString()
        )

        val result = tree.runOrResume(null, null, null)
        assertEquals(
            "Suspended[ExpandingStack[CalaF-54854AB@|0,11,12,13]]",
            result.toString()
        )
        assertNotNull(result.asStillRunning())

        val suspendedResult = result.asStillRunning()!!
        val serialized: String = RestorePersistence.encodeToString(suspendedResult.restore())
        assertEquals("@N@BACalaF-54854", serialized)

        val deserialized = RestorePersistence.decodeFullString(serialized)
        assertEquals(
            "Restored[Stack[@BACalaF-54854|0]]",
            deserialized.toString()
        )

        val secondResult = tree.resume(null, null, deserialized)
        assertEquals(Result.SUCCESS, secondResult)
    }

    @Test
    fun retry_decorator_repeats_on_failure_max_times() {
        val tree3 =
            3 timesTry hardCodedTaskResults<Any?, Any?>(
                Result.FAIL,
                Result.FAIL,
                Result.FAIL,
                Result.SUCCESS,
                Result.FAIL
            )

        assertEquals(Result.FAIL, tree3.run(null, null)) // gets to failures only

        val tree4 = RetryFailures(
            4,
            hardCodedTaskResults<Any?, Any?>(Result.FAIL, Result.FAIL, Result.FAIL, Result.SUCCESS, Result.FAIL)
        )

        assertEquals(Result.SUCCESS, tree4.run(null, null)) // gets to the success
    }

    @Test
    fun retry_decorator_suspends_to_restart() {
        val taskThatFailsSometimes =
            hardCodedTaskResults<Any?, Any?>(Result.FAIL, StillRunning(), Result.FAIL, Result.SUCCESS, Result.FAIL)

        val tree = RetryFailures(3, taskThatFailsSometimes)

        assertEquals("RetryFailures[3|[object Object]]", tree.toString())
        val firstResult = tree.runOrResume(null, null, null)

        assertEquals("Suspended[ExpandingStack[B|0]]", firstResult.toString())
        assertNotNull(firstResult.asStillRunning())

        val suspendedResult = firstResult.asStillRunning()!!
        val serialized: String = RestorePersistence.encodeToString(suspendedResult.restore())
        assertEquals("@AB", serialized)

        val deserialized = RestorePersistence.decodeFullString(serialized)
        assertEquals("Restored[Stack[B|0]]", deserialized.toString())

        val secondResult = tree.resume(null, null, deserialized)
        assertEquals(Result.SUCCESS, secondResult)
    }

    @Test
    fun decorator_suspends_on_failure_to_retry_and_scope_refresh() {
        val taskThatFailsSometimes =
            providedTaskResults<Any?, String>(
                { _, d -> Result.FAIL },
                { _, d -> check(d == "whatevs") { "must have \"whatevs\", got $d" }; StillRunning() },
                { _, d -> check(d == "whatevs") { "must have \"whatevs\", got $d" }; Result.FAIL },
                { _, d -> check(d == "whatevs") { "must have \"whatevs\", got $d" }; Result.SUCCESS },
                { _, d -> check(d == null) { "must have no prev result, got $d" }; Result.FAIL })

        val scopedTask = Scoped<Any?, Int, String>(StringPersistence) { _, _ -> "whatevs" } then taskThatFailsSometimes
        val tree = Scoped<Any?, Unit?, Int>(SmallPositiveIntPersistence) { _, _ -> 3 } then SuspendIfFail(scopedTask)

        assertEquals("Scoped[SuspendFailureAndRetry[Scoped[[object Object]]]]", tree.toString())
        val firstResult = tree.runOrResume(null, null, null)

        assertEquals("Suspended[ExpandingStack[C|0]]", firstResult.toString())
        assertNotNull(firstResult.asStillRunning())

        val suspendedResult = firstResult.asStillRunning()!!
        val serialized: String = RestorePersistence.encodeToString(suspendedResult.restore())
        assertEquals("@AC", serialized)

        val deserialized = RestorePersistence.decodeFullString(serialized)
        assertEquals("Restored[Stack[C|0]]", deserialized.toString())

        val secondResult = tree.runOrResume(null, null, deserialized)
        assertEquals("Suspended[ExpandingStack[Gwhatevs?C|0,8,9]]", secondResult.toString())
        assertNotNull(secondResult.asStillRunning())

        val thirdResult = tree.runOrResume(null, null, secondResult.restore())
        assertEquals("Suspended[ExpandingStack[C|0]]", thirdResult.toString())
        assertNotNull(thirdResult.asStillRunning())

        val lastResult = tree.runOrResume(null, null, thirdResult.restore())
        assertEquals(Result.SUCCESS, lastResult)
    }

    @Test
    fun building_behavior_tree_with_infix_operators() {
        assertEquals(
            "Selector[[object Object], [object Object], [object Object]]",
            (failTask or failTask or successTask).toString()
        )

        assertEquals(
            "Sequence[[object Object], [object Object], [object Object]]",
            (failTask then failTask then successTask).toString()
        )

        assertEquals(
            "Selector[[object Object], Sequence[[object Object], [object Object]]]",
            (failTask or (failTask then successTask)).toString()
        )
        assertEquals(
            "Sequence[[object Object], Selector[[object Object], [object Object]]]",
            (failTask then (failTask or successTask)).toString()
        )

        assertEquals(
            "Sequence[[object Object], [object Object], [object Object], [object Object]]",
            ((failTask then successTask) then (failTask then successTask)).toString()
        )

        assertEquals(
            "Selector[[object Object], [object Object], [object Object], [object Object]]",
            ((failTask or successTask) or (failTask or successTask)).toString()
        )
    }

    @Test
    fun parallel_composite_runs_until_failure_is_detected() {
        val taskFailingFirstTimeThenSucceeding =
            hardCodedTaskResults<Any?, Any?>(Result.FAIL, Result.SUCCESS, bad)
        val task2 =
            hardCodedTaskResults<Any?, Any?>(Result.SUCCESS, StillRunning(), Result.SUCCESS, bad)
        val task3 =
            hardCodedTaskResults<Any?, Any?>(StillRunning(), StillRunning(), StillRunning(), Result.SUCCESS)

        val parallel: Task<Any?, Any?> = (concurrent
                with taskFailingFirstTimeThenSucceeding
                and task2
                and task3)

        assertEquals("Parallel[[object Object], [object Object], [object Object]]", parallel.toString())

        var runningResult = parallel.runOrResume(null, null, null)
        assertEquals(Result.FAIL, runningResult)

        runningResult = parallel.runOrResume(null, null, runningResult.restore())
        assertTrue(!runningResult.isImmediate())
        assertEquals("Suspended[ExpandingStack[KBAAB@@ABB@@|0]]", runningResult.toString())

        runningResult = parallel.runOrResume(null, null, runningResult.restore())
        assertTrue(!runningResult.isImmediate())
        assertEquals("Suspended[ExpandingStack[FAABB@@|0]]", runningResult.toString())

        runningResult = parallel.runOrResume(null, null, runningResult.restore())
        assertEquals(Result.SUCCESS, runningResult)
    }

    @Test
    fun parallel_scoped_composite_runs_until_failure_is_detected() {
        val bb = "chars!"
        val tasks = mutableMapOf('c' to 3, 'h' to 0, 'a' to 2, 'r' to 4, 's' to 0, '!' to 2)

        val assembled = StringBuilder()
        val childTask = Action<Unit, Char> { _, char ->
            val counted = checkNotNull(tasks[char])
            tasks[char] = counted - 1
            when {
                (counted <= 0) -> {
                    assembled.append(char)
                    Result.SUCCESS
                }

                else -> StillRunning()
            }
        }
        val parallelTask =
            SplitBlackboardInParallel<Unit, String, Char, Char>(
                CharPersistence,
                childTask,
                { _, s -> s.toList() },
                { _, k, c -> k })

        var result: Result? = null
        result = parallelTask.runOrResume(Unit, bb, result.restore())
        assertEquals("Suspended[ExpandingStack[MDc@@a@@r@@!@@|0]]", result.toString())
        assertEquals("hs", assembled.toString())

        result = parallelTask.runOrResume(Unit, bb, result.restore())
        assertEquals("Suspended[ExpandingStack[MDc@@a@@r@@!@@|0]]", result.toString())
        assertEquals("hs", assembled.toString())

        result = parallelTask.runOrResume(Unit, bb, result.restore())
        assertEquals("Suspended[ExpandingStack[GBc@@r@@|0]]", result.toString())
        assertEquals("hsa!", assembled.toString())

        result = parallelTask.runOrResume(Unit, bb, result.restore())
        assertEquals("Suspended[ExpandingStack[DAr@@|0]]", result.toString())
        assertEquals("hsa!c", assembled.toString())

        result = parallelTask.runOrResume(Unit, bb, result.restore())
        assertEquals(Result.SUCCESS, result)
        assertEquals("hsa!cr", assembled.toString())

        result = parallelTask.runOrResume(Unit, bb, result.restore())
        assertEquals(Result.SUCCESS, result)
        assertEquals("hsa!crchars!", assembled.toString()) // ran a second time but in order
    }
}

internal fun Result?.asStillRunning(): StillRunning? =
    this?.let { if (!this.isImmediate()) (this as StillRunning) else null }


 */
