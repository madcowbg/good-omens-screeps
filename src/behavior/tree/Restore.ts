import { Stack } from "./Stack";
import { Persistence } from "../../utils/persistence/Persistence";
import { EncodedStream } from "../../utils/persistence/EncodedStream";

export class Restore {
  // todo rewrite faster!
  public static readonly RestorePersistence: Persistence<Restore> = {
    encode(value: Restore): string {
      return Stack.StackPersistence.encode(value.stack);
    },
    decode(encoded: EncodedStream): Restore {
      return new Restore(Stack.StackPersistence.decode(encoded));
    }
  };

  public readonly stack: Stack;

  public constructor(stack: Stack) {
    this.stack = stack;
  }

  public toString(): string {
    return `Restored[${this.stack.toString()}]`;
  }
}
