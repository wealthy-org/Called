// Load .env before any module that reads process.env is evaluated. Import this
// module first; ES module evaluation follows import order.
try {
  process.loadEnvFile();
} catch {
  // no .env file present, rely on the ambient environment
}
