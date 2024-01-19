import { assert } from "chai";

export class EncodedStream {
  private readonly encoded: string;
  private idx = 0;

  public constructor(encoded: string) {
    this.encoded = encoded;
  }

  public pop(n: number): string {
    assert(this.idx + n <= this.encoded.length, "not enough bytes left!");
    const result = this.encoded.substring(this.idx, this.idx + n);
    this.idx += n;
    return result;
  }
}
