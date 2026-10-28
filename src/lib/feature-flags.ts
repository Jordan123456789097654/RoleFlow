import { prisma } from "./prisma";

export const FLAG_DEFAULTS: Record<string, boolean> = {
  marketplace: true,
  roblox_linking: true,
  community_reports: true,
};

export async function getFlags(): Promise<Record<string, boolean>> {
  const row = await prisma.systemSetting.findUnique({ where: { key: "feature_flags" } });
  try {
    return { ...FLAG_DEFAULTS, ...(row ? JSON.parse(row.value) : {}) };
  } catch {
    return { ...FLAG_DEFAULTS };
  }
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getFlags();
  return flags[key] ?? true;
}
