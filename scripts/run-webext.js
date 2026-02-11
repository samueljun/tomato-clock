const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Determine default firefox executable by platform
function defaultFirefoxPath() {
  if (process.env.FIREFOX_PATH) return process.env.FIREFOX_PATH;
  switch (process.platform) {
    case "darwin":
      return "/Applications/Firefox.app/Contents/MacOS/firefox";
    case "win32":
      // Common install locations on Windows
      const programFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";
      const programFilesx86 =
        process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
      const candidates = [
        path.join(programFiles, "Mozilla Firefox", "firefox.exe"),
        path.join(programFilesx86, "Mozilla Firefox", "firefox.exe"),
        "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
        "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
      ];
      return candidates.find((p) => fs.existsSync(p)) || null;
    default:
      // On Linux, assume `firefox` is on PATH
      return "firefox";
  }
}

(async function main() {
  const firefoxExe = defaultFirefoxPath();

  const target = process.argv[2];

  let args = [];
  if (target === "chromium") {
    args = ["run", "-t", "chromium", "--source-dir", "./dist"];
  } else {
    args = ["run", "--source-dir", "./dist"];

    if (firefoxExe) {
      try {
        if (firefoxExe !== "firefox" && fs.existsSync(firefoxExe)) {
          // insert -f <path> after 'run'
          const runIndex = args.indexOf("run");
          if (runIndex >= 0) {
            args.splice(runIndex + 1, 0, "-f", firefoxExe);
          } else {
            // fallback: append
            args.push("-f", firefoxExe);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // Build command string and run via shell to avoid Windows .cmd spawn issues
  const escapeArg = (s) => String(s).replace(/"/g, '\\"');
  const cmdStr = `npx web-ext ${args.map((a) => `"${escapeArg(a)}"`).join(" ")}`;
  const proc = spawn(cmdStr, { stdio: "inherit", shell: true });

  proc.on("close", (code) => {
    process.exit(code);
  });
})();
