import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * format date with template
 * @param millis millisecond timestamp
 * @param template format template
 * @returns formatted time
 */
export function formatDate(
  millis: number,
  template: string = "YYYY-M-D HH:mm"
) {
  return dayjs.utc(millis).format(template);
}

export function formatWithdrawRemaingTime(milliSeconds: number) {
  if (milliSeconds <= 0 || isNaN(milliSeconds)) {
    return "0 D";
  }
  const sec_num = (milliSeconds / 1000).toFixed(0);
  var days = Math.floor(Number(sec_num) / (3600 * 24)).toString();
  var hours = Math.floor(
    (Number(sec_num) - Number(days) * 3600 * 24) / 3600
  ).toString();
  var minutes = Math.floor(
    (Number(sec_num) - Number(days) * 3600 * 24 - Number(hours) * 3600) / 60
  ).toString();
  var seconds = (
    Number(sec_num) -
    Number(days) * 3600 * 24 -
    Number(hours) * 3600 -
    Number(minutes) * 60
  ).toString();

  if (Number(days) < 0) {
    days = "0";
  }
  if (Number(days) > 0) {
    return `${days} day${Number(days) === 1 ? "" : "s"}`;
  }
  if (Number(hours) > 0) {
    return `${hours} hour${Number(hours) === 1 ? "" : "s"}`;
  }
  if (Number(minutes) > 0) {
    return `${minutes} min${Number(minutes) === 1 ? "" : "s"}`;
  }
  return "<1 min";
}
