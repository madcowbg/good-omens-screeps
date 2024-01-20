import { Persistence } from "./Persistence";
import { StringPersistence } from "./BasicPersistence";
import { EncodedStream } from "./EncodedStream";

export const NumberPersistence: Persistence<number> = {
  encode(value: number): string {
    return StringPersistence.encode(value.toString());
  },
  decode(encoded: EncodedStream): number {
    return Number.parseFloat(StringPersistence.decode(encoded));
  }
};
