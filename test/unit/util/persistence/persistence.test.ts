import { assert } from "chai";
import { IllegalArgumentError } from "./error/IllegalArgumentError";
import { decodeFullString, encodeToString } from "./Persistence";
import { SmallPositiveIntPersistence, StringPersistence } from "./BasicPersistence";
import { MapPersistence } from "./MapPersistence";
import { Optional } from "./Optional";

describe("SmallPositiveIntPersistence", () => {
  it("should serialize and deserialize as expected", () => {
    const vals = [0, -32, 1, 100, 34464];

    const encoded: string[] = _.map(vals, it => encodeToString(SmallPositiveIntPersistence, it));
    assert.equal("@, ,A,¤,蛠", encoded.toString());

    const decoded = _.map(encoded, it => decodeFullString(SmallPositiveIntPersistence, it));
    assert.deepEqual(vals, decoded);
  });

  it("should fail when out of bounds", () => {
    assert.throw(() => encodeToString(SmallPositiveIntPersistence, -33), IllegalArgumentError);
    assert.throw(() => encodeToString(SmallPositiveIntPersistence, 34465), IllegalArgumentError);
    assert.throw(() => encodeToString(SmallPositiveIntPersistence, 100000), IllegalArgumentError);
  });
});

describe("StringPersistence", () => {
  it("should produce the expected serialized values and deserialize properly", () => {
    const vals = ["", "!", "ada", "0718蛠n2", "124908168905689012096840168923689012093610924761209837612073896"];

    const encoded = _.map(vals, it => encodeToString(StringPersistence, it));
    assert.deepEqual(
      "@,A!,Cada,G0718蛠n2,\u007F124908168905689012096840168923689012093610924761209837612073896",
      encoded.toString()
    );

    const decoded = _.map(encoded, it => decodeFullString(StringPersistence, it));
    assert.deepEqual(vals, decoded);
  });
});

describe("MapPersistence", () => {
  it("should serialize and deserialize as expected if map int to int", () => {
    const valsIntToInt: Map<number, number>[] = [
      new Map<number, number>(),
      new Map([
        [10, 1],
        [1, 10]
      ]),
      new Map(_.map(_.range(1, 10 + 1), i => [i % 4, i])),
      new Map(_.map(_.range(1, 10 + 1), i => [i, i % 4]))
    ];
    const mapIntInt = new MapPersistence(SmallPositiveIntPersistence, SmallPositiveIntPersistence);

    const encoded = _.map(valsIntToInt, it => encodeToString(mapIntInt, it));
    assert.equal(encoded.toString(), "@,BJAAJ,DAIBJCG@H,JAABBCCD@EAFBGCH@IAJB");

    const decoded = _.map(encoded, it => decodeFullString(mapIntInt, it));
    assert.deepEqual(decoded, valsIntToInt);
  });

  it("should serialize and deserialize as expected if string to int", () => {
    const valsStringToInt: Map<string, number>[] = [
      new Map<string, number>(),
      new Map([
        ["121", 1],
        ["", 1312]
      ]),
      new Map(_.map(_.range(1, 10 + 1), i => [`${i % 4}${i % 4}`, i % 4])),
      new Map(_.map(_.range(1, 10 + 1), i => [`${i}${i}`, i]))
    ];

    const mapStringInt = new MapPersistence(StringPersistence, SmallPositiveIntPersistence);
    const encoded = _.map(valsStringToInt, it => encodeToString(mapStringInt, it));
    assert.equal("@,BC121A@ՠ,DB11AB22BB33CB00@,JB11AB22BB33CB44DB55EB66FB77GB88HB99ID1010J", encoded.toString());

    const decoded = _.map(encoded, it => decodeFullString(mapStringInt, it));
    assert.deepEqual(decoded, valsStringToInt);
  });
});

describe("Optional", () => {
  it("should serialize and deserialize properly", () => {
    const valStringOrNull = [undefined, "123123", ""];
    const nullablePersistence = new Optional(StringPersistence);

    const encoded = _.map(valStringOrNull, it => encodeToString(nullablePersistence, it));
    assert.equal("-,+F123123,+@", encoded.toString());

    const decoded = _.map(encoded, it => decodeFullString(nullablePersistence, it));
    assert.deepEqual(valStringOrNull, decoded);
  });
});

/*
package utils

import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PersistenceTest {

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
