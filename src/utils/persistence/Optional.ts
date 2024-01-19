import { Persistence } from "./Persistence";
import { EncodedStream } from "./EncodedStream";
import { IllegalArgumentError } from "./error/IllegalArgumentError";

export class Optional<Type> implements Persistence<Type | undefined> {
  private readonly child: Persistence<Type>;

  constructor(child: Persistence<Type>) {
    this.child = child;
  }

  public encode(value?: Type): string {
    if (value == undefined) {
      return "-";
    } else {
      return "+" + this.child.encode(value);
    }
  }

  public decode(encoded: EncodedStream): Type | undefined {
    switch (encoded.pop(1)) {
      case "-":
        return undefined;
      case "+":
        return this.child.decode(encoded);
      default:
        throw new IllegalArgumentError("needs + or - to decide if the value is encoded.");
    }
  }
}
