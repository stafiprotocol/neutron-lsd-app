import {
  CANCELLED_ERR_MESSAGE1,
  CANCELLED_ERR_MESSAGE2,
  KEPLR_ERROR_REJECT,
} from "constants/common";

/**
 * create uuid
 * @returns uuid
 */
export function uuid() {
  try {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;

        return v.toString(16);
      }
    );
  } catch {
    return "";
  }
}

/**
 * open link in new tab
 * @param url link's url
 */
export function openLink(url: string | undefined | null) {
  if (!url) {
    return;
  }
  const otherWindow = window.open();
  if (otherWindow) {
    otherWindow.opener = null;
    otherWindow.location = url;
  }
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isEmptyValue(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  return false;
}

export const isKeplrCancelError = (err: any) => {
  return (err as Error).message === KEPLR_ERROR_REJECT;
};

export const isKeplrInstalled = () => {
  return (window as any).getOfflineSignerAuto && (window as any).keplr;
};
