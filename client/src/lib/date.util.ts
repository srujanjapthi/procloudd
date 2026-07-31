import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatRelativeTime(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}

export function formatAbsoluteDate(timestamp: number): string {
  return dayjs(timestamp).format("MMM D, YYYY h:mm A");
}
