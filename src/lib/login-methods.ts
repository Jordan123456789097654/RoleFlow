export interface LoginMethods {
  hasDiscord: boolean;
  hasPassword: boolean;
}

/**
 * Validates whether unlinking a login method is safe or blocked.
 * Unlinking the LAST remaining authentication method is strictly blocked.
 */
export function canUnlinkMethod(methods: LoginMethods, methodToUnlink: "discord" | "password"): {
  canUnlink: boolean;
  error?: string;
} {
  const activeCount = (methods.hasDiscord ? 1 : 0) + (methods.hasPassword ? 1 : 0);

  if (methodToUnlink === "discord") {
    if (!methods.hasDiscord) {
      return { canUnlink: false, error: "Discord is not linked." };
    }
    if (activeCount <= 1) {
      return {
        canUnlink: false,
        error: "Cannot unlink Discord. You must set a password first so you don't lose access to your account.",
      };
    }
    return { canUnlink: true };
  }

  if (methodToUnlink === "password") {
    if (!methods.hasPassword) {
      return { canUnlink: false, error: "Password is not set." };
    }
    if (activeCount <= 1) {
      return {
        canUnlink: false,
        error: "Cannot remove password. You must link Discord first so you don't lose access to your account.",
      };
    }
    return { canUnlink: true };
  }

  return { canUnlink: false, error: "Unknown method." };
}
