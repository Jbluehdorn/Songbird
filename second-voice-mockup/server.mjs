import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createState, renderScreen } from "./artboards.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const exportDir = path.join(root, "exports");
await mkdir(exportDir, { recursive: true });
const frames = [
  ["setup", "01-song-setup.svg"],
  ["review", "02-melody-review.svg"],
  ["workspace", "03-harmony-workspace.svg"],
  ["learn", "04-learn-my-part.svg"],
];
for (const [name, filename] of frames) {
  await writeFile(path.join(exportDir, filename), renderScreen(name, createState()), "utf8");
}

const routes = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/preview.mjs", ["preview.mjs", "text/javascript; charset=utf-8"]],
  ["/artboards.mjs", ["artboards.mjs", "text/javascript; charset=utf-8"]],
  ["/exports/Figma-import.txt", [path.join("exports", "Figma-import.txt"), "text/plain; charset=utf-8"]],
  ["/exports/second-voice-figma-import.zip", [path.join("exports", "second-voice-figma-import.zip"), "application/zip"]],
  ...frames.map(([, filename]) => [`/exports/${filename}`, [path.join("exports", filename), "image/svg+xml"]]),
]);

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/favicon.ico") { response.writeHead(204); response.end(); return; }
  const route = routes.get(pathname);
  if (!route || !["GET", "HEAD"].includes(request.method)) {
    response.writeHead(404, { "Content-Type": "text/plain" }); response.end("Not found"); return;
  }
  try {
    const content = await readFile(path.join(root, route[0]));
    response.writeHead(200, { "Content-Type": route[1], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    console.error(`Cannot serve ${pathname}:`, error.message);
    response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain" });
    response.end("Requested mockup asset is unavailable.");
  }
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  console.log(`SECOND_VOICE_PREVIEW=http://127.0.0.1:${address.port}/`);
  console.log(`EDITABLE_FRAMES=${exportDir}`);
});
