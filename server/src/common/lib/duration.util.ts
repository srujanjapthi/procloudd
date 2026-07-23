import ms from "ms";
import type { StringValue } from "ms";

export function toMs(duration: StringValue): number {
  return ms(duration);
}
