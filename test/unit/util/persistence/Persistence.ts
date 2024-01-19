import { EncodedStream } from "./EncodedStream";

export interface Persistence<Type> {
  encode(value: Type): string;

  decode(encoded: EncodedStream): Type;
}

export function encodeToString<Type>(persistence: Persistence<Type>, value: Type): string {
  return persistence.encode(value);
}

export function decodeFromString<Type>(persistence: Persistence<Type>, encoded: string): Type {
  return persistence.decode(new EncodedStream(encoded));
}
