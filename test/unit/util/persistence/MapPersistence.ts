import { Persistence } from "./Persistence";
import { SmallPositiveIntPersistence } from "./BasicPersistence";
import { EncodedStream } from "./EncodedStream";

export class MapPersistence<KType, VType> implements Persistence<Map<KType, VType>> {
  private persistKey: Persistence<KType>;
  private persistValue: Persistence<VType>;

  public constructor(persistKey: Persistence<KType>, persistValue: Persistence<VType>) {
    this.persistKey = persistKey;
    this.persistValue = persistValue;
  }

  public encode(value: Map<KType, VType>): string {
    let result = SmallPositiveIntPersistence.encode(value.size); // todo maybe switch to NumberPersistence?
    for (const [k, v] of value.entries()) {
      result += this.persistKey.encode(k) + this.persistValue.encode(v);
    }
    return result;
  }

  public decode(encoded: EncodedStream): Map<KType, VType> {
    const result = new Map<KType, VType>();
    const size = SmallPositiveIntPersistence.decode(encoded);
    for (let i = 0; i < size; i++) {
      const key = this.persistKey.decode(encoded);
      const value = this.persistValue.decode(encoded);
      result.set(key, value);
    }
    return result;
  }
}
