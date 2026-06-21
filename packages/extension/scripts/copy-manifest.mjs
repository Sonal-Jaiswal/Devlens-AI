import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = resolve("manifest.json");
const destination = resolve("dist/manifest.json");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);