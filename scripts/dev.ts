import type { ServerWebSocket } from "bun";
import kleur from "kleur";
import { watch } from "node:fs";
import {
	buildJS,
	compileSCSS,
	copyAssets,
	getBuildArgs,
	getManifest,
	writeDNRRules,
	writeI18n,
	writeManifest,
	writePopup,
} from "./build.ts";
import { DEFAULT_OUTDIR, DEV_SERVER_WS_PORT } from "./build/constants.ts";
import { getBuildTimeParams, getDevServersAvailable, updateLog } from "./build/utils.ts";

const { target, targetBase } = getBuildArgs();

const connections = new Set<ServerWebSocket<unknown>>();
Bun.serve({
	fetch(req, server) {
		if (server.upgrade(req)) {
			return;
		}
		return new Response("Pong!", {
			status: 200,
			headers: {
				"access-control-allow-origin": "*",
			},
		});
	},
	websocket: {
		open: (ws) => {
			connections.add(ws);
		},
		close: (ws) => {
			connections.delete(ws);
		},
		message: () => {},
	},
	port: DEV_SERVER_WS_PORT,
});

const manifest = await getManifest();
const devServers = await getDevServersAvailable(true, true);
const { robloxVersion, cspPolicy } = await getBuildTimeParams(target, true);

await updateLog(
	Promise.all([
		compileSCSS({
			outDir: DEFAULT_OUTDIR,
			target,
			targetBase,
			manifest,
			isDev: true,
			devServers,
		}),
		buildJS({ outDir: DEFAULT_OUTDIR, target, targetBase, manifest, isDev: true, devServers }),
		writeI18n({
			outDir: DEFAULT_OUTDIR,
		}),
		buildJS({ outDir: DEFAULT_OUTDIR, target, targetBase, manifest, isDev: true, devServers }),
		writeManifest({
			target,
			outDir: DEFAULT_OUTDIR,
			targetBase,
			manifest,
			isDev: true,
			devServers,
		}),
		writePopup({
			outDir: DEFAULT_OUTDIR,
			isDev: true,
		}),
		copyAssets({ outDir: DEFAULT_OUTDIR, isDev: true, manifest }),
		writeDNRRules({
			outDir: DEFAULT_OUTDIR,
			target,
			version: manifest.version,
			isDev: true,
			devServers,
			robloxVersion,
			cspPolicy,
		}),
	]).then(() => console.clear()),
	"Initial build for dev mode",
).catch(() => {});

console.log(kleur.gray(`Listening on port ${DEV_SERVER_WS_PORT}`));
console.log("Watching for changes...");

function handleChange(value: Promise<unknown>, type?: string) {
	console.clear();
	console.log("Change detected, rebuilding necessary files...");

	return updateLog(value, "Rebuilt necessary files").then(() => {
		if (type) {
			for (const connection of connections) {
				connection.send(
					JSON.stringify({
						type,
					}),
				);
			}
		}
	});
}

watch("./src/scss/", { recursive: true }, () =>
	handleChange(
		getDevServersAvailable(true, true).then((devServers) =>
			compileSCSS({
				outDir: DEFAULT_OUTDIR,
				target,
				targetBase,
				isDev: true,
				devServers,
			}),
		),
		"CSS",
	),
);
watch("./src/ts/", { recursive: true }, () =>
	handleChange(
		getDevServersAvailable(true, true).then((devServers) =>
			buildJS({
				outDir: DEFAULT_OUTDIR,
				target,
				targetBase,
				isDev: true,
				devServers,
			}),
		),
		"Reload",
	),
);
watch("./src/img/", { recursive: true }, () =>
	handleChange(
		copyAssets({
			outDir: DEFAULT_OUTDIR,
			isDev: true,
		}),
	),
);
watch("./src/i18n/", { recursive: true }, () =>
	handleChange(
		Promise.all([
			writeI18n({
				outDir: DEFAULT_OUTDIR,
			}),
			getDevServersAvailable(true, true).then((devServers) =>
				buildJS({
					outDir: DEFAULT_OUTDIR,
					target,
					targetBase,
					isDev: true,
					devServers,
				}),
			),
		]),
		"Reload",
	),
);
watch("./src/manifest.jsonc", { recursive: true }, () =>
	handleChange(
		getDevServersAvailable(true, true).then((devServers) =>
			writeManifest({
				target,
				outDir: DEFAULT_OUTDIR,
				targetBase,
				isDev: true,
				devServers,
			}),
		),
		"Reload",
	),
);
watch("./src/popup.html", { recursive: true }, () =>
	handleChange(
		writePopup({
			outDir: DEFAULT_OUTDIR,
			isDev: true,
		}),
		"Reload",
	),
);
