import { spawn } from "node:child_process";

export function browserCommand(
  platform: NodeJS.Platform,
  url: string,
): { command: string; args: string[] } {
  switch (platform) {
    case "darwin":
      return { command: "open", args: [url] };
    case "win32":
      return { command: "cmd", args: ["/c", "start", "", url] };
    default:
      return { command: "xdg-open", args: [url] };
  }
}

export function openBrowser(url: string): void {
  try {
    const { command, args } = browserCommand(process.platform, url);
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.on("error", () => {});
    child.unref();
  } catch {
    // The address is already on the terminal; opening the browser is a convenience.
  }
}
