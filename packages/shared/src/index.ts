/** Default local API URL when `NEXT_PUBLIC_API_URL` / `VITE_API_URL` is unset. */
export const DEFAULT_API_URL = "http://127.0.0.1:3333";

export const USER_ROLES = ["CUSTOMER", "RESTAURANT_OWNER", "RIDER", "ADMIN"] as const;
export type UserRoleName = (typeof USER_ROLES)[number];
