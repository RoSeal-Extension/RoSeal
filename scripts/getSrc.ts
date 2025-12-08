// Build a zip to give to store review staff for src inspection.

import { ensureDir } from "fs-extra";
import { parse as parseJSONC } from "jsonc-parser";
import type { Manifest } from "./build/constants";
import { getBuildTimeParams } from "./build/utils";

const manifest = parseJSONC(await Bun.file("./src/manifest.jsonc").text()) as Manifest;
await ensureDir("builds-dist/");

const buildTimeParams = await getBuildTimeParams();

// ensure the build time variables are the same when they try to build
const cachedBuildTime = Bun.file("cachedBuildTime.json");
await cachedBuildTime.write(JSON.stringify(buildTimeParams));

if (process.platform === "win32") {
	console.assert(
		(
			await Bun.$`zip -r ./builds-dist/RoSeal-${manifest.version}-src.zip "./cachedBuildTime.json" "./src/"  "./.npmrc" "./scripts/" "./package.json" "./biome.json" "./tsconfig.json" "./bun.lock" "./README.md" -x "**/.DS_Store" -x "**/__MACOSX" -x "**/*_secret*" -x "**/*_dev*" -x ".git" -9 > /dev/null`
		).exitCode === 0,
	);
} else {
	console.assert(
		(
			await Bun.$`tar -a -c -f ./builds-dist/RoSeal-${manifest.version}-src.zip --exclude ".DS_Store" --exclude "__MACOSX" --exclude "*_secret*" --exclude "*_dev*" --exclude ".git" "./cachedBuildTime.json" "./src/" "./.npmrc" "./scripts/" "./package.json" "./biome.json" "./tsconfig.json" "./bun.lock" "./README.md" > NUL`
		).exitCode === 0,
	);
}

await cachedBuildTime.delete();
