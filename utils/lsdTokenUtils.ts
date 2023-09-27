import { getUnstakeDuration } from "./configUtils";

export function getUnstakeDaysLeft(unbondingDuration?: number) {
  return unbondingDuration
    ? (unbondingDuration / 86400).toFixed(0)
    : getUnstakeDuration();
}
