import { Persistence, decodeFullString } from "../../utils/persistence/Persistence";
import { EncodedStream } from "../../utils/persistence/EncodedStream";
import { StringPersistence } from "../../utils/persistence/BasicPersistence";

export class Stack {
  // todo remove this deprecated logic
  public static readonly StackPersistence: Persistence<Stack> = {
    encode(value: Stack): string {
      return StringPersistence.encode(JSON.stringify(value.stack));
    },

    decode(encoded: EncodedStream): Stack {
      return new Stack(JSON.parse(StringPersistence.decode(encoded)));
    }
  };

  private readonly stack: any[];

  public constructor(stack: any[]) {
    this.stack = stack;
  }

  public hasNoMore(): boolean {
    return this.stack.length === 0;
  }

  public popInt(): number {
    return this.stack.pop() as number;
  }

  public pop<T>(persistence: Persistence<T>): T {
    return decodeFullString(persistence, this.stack.pop() as string);
  }

  public toString(): string {
    return `Stack[${this.stack.toString()}]`;
  }
}
