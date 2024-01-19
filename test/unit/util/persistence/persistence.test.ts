import { assert } from "chai";
import { IllegalArgumentError } from "./error/IllegalArgumentError";
import { decodeFromString, encodeToString } from "./Persistence";
import { SmallPositiveIntPersistence } from "./SmallPositiveIntPersistence";

describe("SmallPositiveIntPersistence", () => {
  it("should serialize and deserialize as expected", () => {
    const vals = [0, -32, 1, 100, 34464];

    const encoded: string[] = _.map(vals, it => encodeToString(SmallPositiveIntPersistence, it));
    assert.equal("@, ,A,¤,蛠", encoded.toString());

    const decoded = _.map(encoded, it => decodeFromString(SmallPositiveIntPersistence, it));
    assert.deepEqual(vals, decoded);
  });

  it("should fail when out of bounds", () => {
    assert.throw(() => encodeToString(SmallPositiveIntPersistence, -33), IllegalArgumentError);
    assert.throw(() => encodeToString(SmallPositiveIntPersistence, 34465), IllegalArgumentError);
    assert.throw(() => encodeToString(SmallPositiveIntPersistence, 100000), IllegalArgumentError);
  });
});

/*
package utils

import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PersistenceTest {
  it("should produce the expected serialized values and deserialize properly", () => {
    const vals = ["", "!", "ada", "0718蛠n2", "124908168905689012096840168923689012093610924761209837612073896"]

    const encoded = _.map(vals, encodeToString(StringPersistence, it))
    assertEquals(
      "[@, A!, Cada, G0718蛠n2, \u007F124908168905689012096840168923689012093610924761209837612073896]",
      encoded.toString()
    )

    val decoded = encoded.map { StringPersistence.decodeFullString(it) }
    assertContentEquals(vals, decoded)
  })

    @Test
    fun string_persistence_serializes_and_deserializes_as_expected() {

    }

    @Test
    fun map_persistence_int_int_serializes_and_deserializes_as_expected() {
        val valsIntToInt = listOf(
            mapOf(),
            mapOf(10 to 1, 1 to 10),
            (1..10).associateBy { it % 4 })
        val mapIntInt = MapPersistence(SmallPositiveIntPersistence, SmallPositiveIntPersistence)

        val encoded = valsIntToInt.map { mapIntInt.encodeToString(it) }
        assertEquals(
            "[@, BAJAAAAAJ, DAAAIABAJACAGA@AH]",
            encoded.toString()
        )

        val decoded = encoded.map { mapIntInt.decodeFullString(it) }
        assertContentEquals(valsIntToInt, decoded)
    }

    @Test
    fun map_persistence_string_int_serializes_and_deserializes_as_expected() {
        val valsStringToInt = listOf(
            mapOf(),
            mapOf("121" to 1, "" to 1312),
            (1..10).associateBy { it % 4 }.mapKeys { "$it$it" })
        val mapStringInt = MapPersistence(StringPersistence, SmallPositiveIntPersistence)

        val encoded = valsStringToInt.map { mapStringInt.encodeToString(it) }
        assertEquals(
            "[@, BDC121AAA@Aՠ, DGF1=91=9AIIH2=102=10AJGF3=73=7AGGF0=80=8AH]",
            encoded.toString()
        )

        val decoded = encoded.map { mapStringInt.decodeFullString(it) }
        assertContentEquals(valsStringToInt, decoded)
    }

    @Test
    fun persisting_nulls_serialize_and_deserialize_properly() {
        val valStringOrNull = listOf(null, "123123", "")
        val nullablePersistence = NullOr(StringPersistence)

        val encoded = valStringOrNull.map { nullablePersistence.encodeToString(it) }
        assertEquals("[0, 1F123123, 1@]", encoded.toString())

        val decoded = encoded.map { nullablePersistence.decodeFullString(it) }
        assertContentEquals(valStringOrNull, decoded)
    }

    @Test
    fun persisting_sets_serialize_and_deserialize_properly() {
        val valSet = listOf(setOf(), setOf("123123"), setOf("", "Abasda", "basda"))
        val setPersistence = CollectionPersistence(StringPersistence)

        val encoded = valSet.map { setPersistence.encodeToString(it) }
        assertEquals("[@, AF123123, C@FAbasdaEbasda]", encoded.toString())

        val decoded = encoded.map { setPersistence.decodeFullString(it).toSet() }
        assertContentEquals(valSet, decoded)
    }
}
 */
