const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const lockedEnvKeys = new Set(Object.keys(process.env));

loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(projectRoot, ".env.local"));

const command = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!command) {
  console.error("Missing Next.js command. Use `dev` or `start`.");
  process.exit(1);
}

const hasExplicitPort = extraArgs.includes("-p") || extraArgs.includes("--port");
const port = (process.env.PORT || "3000").trim();
const nextBin = require.resolve("next/dist/bin/next");
const nextArgs = [nextBin, command];

if (!hasExplicitPort) {
  nextArgs.push("-p", port);
}

nextArgs.push(...extraArgs);

const child = spawn(process.execPath, nextArgs, {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start Next.js:", error);
  process.exit(1);
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (!key || lockedEnvKeys.has(key)) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}
