import { promises as fs } from "fs";
import path from "path";
import { initialTraumData } from "@/data/initial-traum-data";
import { TraumStoreData } from "@/types/traum";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "traum-store.json");

export async function getTraumStore(): Promise<TraumStoreData> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<TraumStoreData>;
    return {
      ...initialTraumData,
      ...parsed,
      settings: {
        ...initialTraumData.settings,
        ...(parsed.settings || {}),
      },
      siteImages: {
        ...initialTraumData.siteImages,
        ...(parsed.siteImages || {}),
      },
      paymentConfig: {
        ...initialTraumData.paymentConfig,
        ...(parsed.paymentConfig || {}),
      },
      reviews: parsed.reviews || initialTraumData.reviews,
    };
  } catch {
    try {
      await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
      await fs.writeFile(
        DATA_FILE_PATH,
        JSON.stringify(initialTraumData, null, 2),
        "utf-8"
      );
    } catch {
      // Ignore write error in read-only environments
    }
    return initialTraumData;
  }
}

export async function saveTraumStore(
  data: TraumStoreData
): Promise<TraumStoreData> {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  return data;
}
