import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

if (process.env.TEST_DATABASE_URL) {
  if (!new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("/nexora_test")) throw new Error("Integration tests require an isolated nexora_test database");
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"], fileParallelism: false },
});
