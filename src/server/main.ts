import { resolve } from "node:path";
import { createApp, listenLocal } from "./app.ts";

const defaultPort = 4747;

const port = Number(process.env.REFPACK_PORT ?? defaultPort);
const webDir = resolve(import.meta.dirname, "../../dist/web");

const app = createApp({ webDir });
const server = await listenLocal(app.fetch, port);

console.log(`refpack: http://${server.address}:${server.port}`);
