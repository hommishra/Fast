// FAST COVERAGES - GLOBAL NEWS NETWORK
// GoDaddy Managed Hosting Production Entry Point
// This file bootstraps the pre-compiled production bundle.

process.env.NODE_ENV = "production";

try {
  require("./dist/server.cjs");
} catch (error) {
  console.error("Failed to load production server bundle:", error);
  process.exit(1);
}
