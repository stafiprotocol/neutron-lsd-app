export function isDev() {
  return process.env.NEXT_PUBLIC_ENV !== "production";
}
