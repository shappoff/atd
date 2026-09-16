import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type PrebuildScript = {
  default: () => void | Promise<void>;
};

const runAsync = async () => {
  const files = fs
    .readdirSync(path.join(__dirname, "pre-build"))
    .filter((file) => file.endsWith(".ts"))
    .sort();

  for (const file of files) {
    const { default: runScript }: PrebuildScript = await import(
      `./pre-build/${file}`
    );

    try {
      console.log(`Running pre-build script '${file}'`);
      await runScript();
    } catch (error) {
      console.error(
        `SCRIPT RUNNER: failed to execute pre-build script '${file}'`,
      );
      console.error(error);
      throw error;
    }
  }
};

runAsync().catch((error) => {
  console.error(error);
  throw error;
});
