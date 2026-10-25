import { Prisma } from "@prisma/client";
import { db } from "./db";

// Retry serialization conflicts; all effects in fn must be database-only.
export async function transaction<T>(fn: (q: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 3) throw error;
    }
  }
}
