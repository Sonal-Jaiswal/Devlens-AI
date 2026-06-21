import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

async function main() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`DevLens AI backend listening on port ${env.port}`);
  });
}

void main();