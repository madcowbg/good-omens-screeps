import { Action } from "../../../../src/behavior/tree/Action";
import { StillRunning } from "../../../../src/behavior/tree/StillRunning";
import { Result } from "../../../../src/behavior/tree/Result";
import { assert } from "chai";
import { Sequence } from "../../../../src/behavior/tree/Sequence";
import { Selector } from "../../../../src/behavior/tree/Selector";

const successTask = new Action<any, any>((o, b) => Result.SUCCESS);
const failTask = new Action<any, any>((o, b) => Result.FAIL);
const stillRunningTask = new Action<any, any>((o, b) => new StillRunning());
const bad: Result = {};

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

private fun <O, B> providedTaskResults(vararg toReturn: (Task<O, B>, B) -> Result): Task<O, B> {
    check(toReturn.isNotEmpty())
    val results = ArrayDeque<(Task<O, B>, B) -> Result>().apply { addAll(toReturn) }
    return Action<O, B> { _, d ->
        if (results.size > 1) results.removeFirst()(this, d) else toReturn.last()(
            this,
            d
        )
    }
}

internal fun <O, B> hardCodedTaskResults(vararg toReturn: Result): Task<O, B> {
    check(toReturn.isNotEmpty())
    val results = ArrayDeque<Result>().apply { addAll(toReturn) }
    return Action<O, B> { _, _ -> if (results.size > 1) results.removeFirst() else toReturn.last() }
}

class BehaviorTreeTest {



    @Test
    fun running_not_results_in_inverse_result() {
        assertEquals(Result.FAIL, !successTask.run(null, null))
        assertEquals(Result.SUCCESS, !failTask.run(null, null))
        assertNotNull((!stillRunningTask.run(null, null)).asStillRunning())
    }

    @Test
    fun behavior_tree_wrapped_task_behaves_like_whatever_it_wraps() {
        val tree = hardCodedTaskResults<Any?, Any?>(StillRunning(), Result.SUCCESS, Result.FAIL)

        assertEquals("[object Object]", tree.toString())
        val res = tree.runOrResume(null, null, null)
        assertEquals("Suspended[ExpandingStack[|]]", res.toString())
        val suspendResult: Restore = res.asStillRunning()!!.restore()

        val secondResult = tree.runOrResume(null, null, suspendResult)
        assertEquals(Result.SUCCESS, secondResult)

        val thirdResult = tree.runOrResume(null, null, suspendResult)
        assertEquals(Result.FAIL, thirdResult)
    }


    @Test
    fun behavior_tree_resume_resumes_from_suspend_state() {
        val taskThatSucceedsOnce = hardCodedTaskResults<Any?, Any?>(Result.SUCCESS, bad)// this one won't run
        val stillRunningOnceTask =
            providedTaskResults<Any?, Any?>(
                { _, _ -> StillRunning() },
                { _, _ -> Result.SUCCESS },
                { _, _ -> Result.FAIL })
        val tree = (taskThatSucceedsOnce then stillRunningOnceTask)

        assertEquals("Sequence[[object Object], [object Object]]", tree.toString())

        val suspendedResult = tree.runOrResume(null, null, null)
        assertEquals("Suspended[ExpandingStack[A|0]]", suspendedResult.toString())
        assertNotNull(suspendedResult.asStillRunning())

        val secondResult = tree.resume(null, null, suspendedResult.asStillRunning()!!.restore())
        assertEquals(Result.SUCCESS, secondResult)

        val thirdResult = tree.resume(null, null, suspendedResult.asStillRunning()!!.restore())
        assertEquals(Result.FAIL, thirdResult)
    }

    @Test
    fun behavior_tree_resume_resumes_from_suspend_state_more_complex_tree() {
        val taskThatFailsOnce = hardCodedTaskResults<Any?, Any?>(Result.FAIL, bad) // this one won't run
        val stillRunningOnceTask =
            providedTaskResults<Any?, Any?>(
                { _, _ -> StillRunning() },
                { _, _ -> Result.SUCCESS },
                { _, _ -> Result.FAIL })
        val tree = Selector(
            Sequence(
                Sequence(),
                Selector(
                    Selector(), !taskThatFailsOnce
                ),
                Selector(
                    Selector(), stillRunningOnceTask, Selector()
                )
            )
        )

        assertEquals(
            "Selector[Sequence[Sequence[], Selector[Selector[], [object Object]], Selector[Selector[], [object Object], Selector[]]]]",
            tree.toString()
        )

        val suspendedResult = tree.runOrResume(null, null, null)
        assertEquals("Suspended[ExpandingStack[AB@|0,1,2]]", suspendedResult.toString())
        assertNotNull(suspendedResult.asStillRunning())
        val suspendResult = suspendedResult.asStillRunning()!!

        println(suspendResult)
        val secondResult = tree.runOrResume(null, null, suspendResult.restore())
        assertEquals(Result.SUCCESS, secondResult)
        println(suspendResult)

        val thirdResult = tree.runOrResume(null, null, suspendResult.restore())
        assertEquals(Result.FAIL, thirdResult)
    }

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
