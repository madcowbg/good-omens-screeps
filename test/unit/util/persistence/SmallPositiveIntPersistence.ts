import { EncodedStream } from "./EncodedStream";
import { IllegalArgumentError } from "./error/IllegalArgumentError";
import { Persistence } from "./Persistence";

const CHAR_ENCODING_OFFSET = 64;

export const SmallPositiveIntPersistence: Persistence<number> = {
  encode(value: number): string {
    if (!(-32 <= value && value <= 34464)) {
      throw new IllegalArgumentError(`${value} is not in -32 to 34464!`);
    }
    return String.fromCharCode(value + CHAR_ENCODING_OFFSET);
  },

  decode(encoded: EncodedStream): number {
    return encoded.pop(1).charCodeAt(0) - CHAR_ENCODING_OFFSET;
  }
};
