import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const routes = new Map([
  ["/", ["preview\\shell.html", "text/html; charset=utf-8"]],
  ["/shell.html", ["preview\\shell.html", "text/html; charset=utf-8"]],
  ["/chord-finder.html", ["preview\\chord-finder.html", "text/html; charset=utf-8"]],
  ["/harmonizer.html", ["preview\\harmonizer.html", "text/html; charset=utf-8"]],
  ["/shell.md", ["shell.md", "text/markdown; charset=utf-8", "shell.md"]],
  ["/chord-finder.md", ["chord-finder.md", "text/markdown; charset=utf-8", "chord-finder.md"]],
  ["/harmonizer.md", ["harmonizer.md", "text/markdown; charset=utf-8", "harmonizer.md"]],
  ["/Songbird-Specifications.zip", ["Songbird-Specifications.zip", "application/zip", "Songbird-Specifications.zip"]],
]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Use GET or HEAD.");
    return;
  }
  const route = routes.get(url.pathname);
  if (!route) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Specification not found.");
    return;
  }
  try {
    const bytes = await readFile(path.join(root, route[0]));
    const headers = {
      "Content-Type": route[1],
      "Content-Length": bytes.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'",
    };
    if (route[2]) headers["Content-Disposition"] = `attachment; filename="${route[2]}"`;
    response.writeHead(200, headers);
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch (cause) {
    console.error(`Unable to serve ${url.pathname}: ${cause.message}`);
    response.writeHead(cause.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("This specification asset is unavailable.");
  }
});

server.listen(0, "127.0.0.1", () => {
  console.log(`SONGBIRD_SPECS_PREVIEW=http://127.0.0.1:${server.address().port}/`);
});
