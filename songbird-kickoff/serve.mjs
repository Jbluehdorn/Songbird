import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const slides = JSON.parse((await readFile(path.join(root, "slides.json"), "utf8")).replace(/^\uFEFF/, ""));
const routes = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/slides.json", ["slides.json", "application/json; charset=utf-8"]],
  ["/Songbird-Team-Kickoff.pptx", ["Songbird-Team-Kickoff.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]],
  ["/Songbird-Team-Kickoff.pdf", ["Songbird-Team-Kickoff.pdf", "application/pdf"]],
  ...slides.map(slide => [`/${slide.image}`, [slide.image.replaceAll("/", path.sep), "image/png"]]),
]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/favicon.ico") { response.writeHead(204); response.end(); return; }
  const route = routes.get(url.pathname);
  if (!route || !["GET", "HEAD"].includes(request.method)) {
    response.writeHead(404, { "Content-Type": "text/plain" }); response.end("Not found"); return;
  }
  try {
    const bytes = await readFile(path.join(root, route[0]));
    response.writeHead(200, { "Content-Type": route[1], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch (cause) {
    console.error(`Unable to serve ${url.pathname}: ${cause.message}`);
    response.writeHead(cause.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain" });
    response.end("This presentation asset is unavailable.");
  }
});
server.listen(0, "127.0.0.1", () => {
  console.log(`SONGBIRD_DECK_PREVIEW=http://127.0.0.1:${server.address().port}/`);
});
