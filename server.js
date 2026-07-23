// FAST COVERAGES - GLOBAL NEWS NETWORK
// Production Entry Point
import { createRequire } from "node:module";

process.env.NODE_ENV = "production";

try {
  const require = createRequire(import.meta.url);
  require("./dist/server.cjs");
} catch (error) {
  console.error("Failed to load production server bundle:", error);
  process.exit(1);
}

