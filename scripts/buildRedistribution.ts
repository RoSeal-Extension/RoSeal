import { emptyDir, remove } from "fs-extra";
import { parse as parseJSONC } from "jsonc-parser";
import { build } from "./build.ts";
import { type Manifest, SUPPORTED_TARGETS } from "./build/constants.ts";
import {
	getBuildTimeParams,
	getDevServersAvailable,
	getTargetBaseFromTarget,
	updateLog,
} from "./build/utils.ts";

const manifest = parseJSONC(await Bun.file("./src/manifest.jsonc").text()) as Manifest;

await emptyDir("builds-dist/");

const devServers = await getDevServersAvailable(false);

const { robloxVersion, cspPolicy } = await getBuildTimeParams();

await updateLog(
	Promise.all(
		SUPPORTED_TARGETS.map(async (target) => {
			const parentFolder = "builds-dist/";
			const folder = `RoSeal-${target}-${manifest.version}`;
			const outDir = `${parentFolder}${folder}`;

			await build({
				target,
				targetBase: getTargetBaseFromTarget(target),
				isDev: false,
				outDir,
				robloxVersion,
				devServers,
				cspPolicy,
			});

			console.assert(
				(
					await Bun.$`cd ${parentFolder}/${folder} && zip -r ../${folder}.zip . -x "**/.DS_Store" -x "**/__MACOSX" -9 > /dev/null`
				).exitCode === 0,
			);

			return remove(outDir);
		}),
	),
	`Built ${manifest.version} for ${SUPPORTED_TARGETS.join(", ")}`,
);
