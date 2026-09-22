import { prisma } from "@/lib/prisma";

export async function getSetting(key: string, fallback: string = ""): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value ?? fallback;
  } catch (err) {
    console.error(`[settings] Failed to fetch ${key}:`, err);
    return fallback;
  }
}

export async function getSettingsByGroup(group: string): Promise<Record<string, string>> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { group },
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  } catch (err) {
    console.error(`[settings] Failed to fetch group ${group}:`, err);
    return {};
  }
}

export async function getAllSettings(): Promise<Record<string, { value: string; group: string; description: string | null }>> {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, { value: string; group: string; description: string | null }> = {};
    for (const s of settings) {
      map[s.key] = { value: s.value, group: s.group, description: s.description };
    }
    return map;
  } catch (err) {
    console.error("[settings] Failed to fetch all settings:", err);
    return {};
  }
}

export async function setSetting(key: string, value: string, group: string = "general", description?: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value, ...(description ? { description } : {}) },
    create: { key, value, group, description },
  });
}
