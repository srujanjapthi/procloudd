import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatRelativeTime(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}
