import { ensureDir, move, remove } from "fs-extra";
import { parse as parseJSONC } from "jsonc-parser";
import { build } from "./build.ts";
import { type Manifest, SUPPORTED_TARGETS } from "./build/constants.ts";
import {
	getBuildTimeParams,
	getDevServersAvailable,
	getTargetBaseFromTarget,
	updateLog,
} from "./build/utils.ts";
import { $ } from "bun";

await ensureDir("builds-dist/");

const manifest = parseJSONC(await Bun.file("./src/manifest.jsonc").text()) as Manifest;

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

			if (import.meta.env.UPLOAD_TO_AMO === "true" && target === "firefox") {
				await $`cd ${outDir}; web-ext sign --channel listed --upload-source-code ../RoSeal-${manifest.version}-src.zip --artifacts-dir artifacts`;
				await move(
					`${outDir}/artifacts/RoSeal-${manifest.store_version}.xpi`,
					`builds-dist/${folder}.xpi`,
				);
			}

			return remove(outDir);
		}),
	),
	`Built ${manifest.version} for ${SUPPORTED_TARGETS.join(", ")}`,
);
