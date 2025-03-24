export const STORAGE_KEY_DARK_MODE = "neutron_lsd_dark_mode_v2";
export const STORAGE_KEY_NOTICE = "neutron_lsd_notice_v2";
export const STORAGE_KEY_UNREAD_NOTICE = "neutron_lsd_unread_notice_v2";
export const STORAGE_KEPLR_WALLET_ALLOWED =
  "neutron_lsd_keplr_network_allowed_";

export function saveStorage(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function getStorage(key: string): string | null {
  return localStorage.getItem(key);
}

export function removeStorage(key: string) {
  localStorage.removeItem(key);
}

export function saveCosmosNetworkAllowedFlag(network: string) {
  saveStorage(STORAGE_KEPLR_WALLET_ALLOWED + network, "1");
}

export function clearCosmosNetworkAllowedFlag(network: string) {
  removeStorage(STORAGE_KEPLR_WALLET_ALLOWED + network);
}

export function isCosmosNetworkAllowed(network: string) {
  return getStorage(STORAGE_KEPLR_WALLET_ALLOWED + network);
}
