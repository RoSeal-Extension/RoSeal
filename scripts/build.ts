import svgrPlugin from "esbuild-plugin-svgr";
import { copy, emptyDir, ensureDir, exists, mkdir, move, readdir, remove, rename } from "fs-extra";
import { minify as minifyHTML } from "html-minifier-terser";
import { parse as parseJSONC } from "jsonc-parser";
import walk from "klaw";
import kleur from "kleur";
import { basename, extname, join, parse as parsePath, relative } from "node:path";
import { parseArgs } from "node:util";
import * as sass from "sass-embedded";
import {
	DEFAULT_OUTDIR,
	getDomains,
	getUserAgentOverrides,
	type I18nFile,
	type Manifest,
	ROSEAL_OVERRIDE_PLATFORM_TYPE_HEADER_NAME,
	ROSEAL_TRACKING_HEADER_NAME,
	SCSS_ENTRYPOINT,
	type Target,
	type TargetBase,
	TARGETS,
	TS_ENTRYPOINT,
} from "./build/constants.ts";
import { buildPagesPlugin } from "./build/plugins/rosealPlugins.ts";
import {
	CONTENT_SECURITY_POLICY_HEADER_NAME,
	type DevServersAvailable,
	getBuildOptions,
	getBuildTimeParams,
	getDevServersAvailable,
	getEnvironmentVariables,
	getI18nTypesFile,
	getTargetBaseFromTarget,
	handleI18NNamespace,
	transformManifest,
	updateLog,
} from "./build/utils.ts";
import { STATIC_RULES_START_ID } from "src/ts/constants/dnrRules.ts";

const BASE_COMMENT_BANNER = `
 * RoSeal Extension
 *
 * Copyright (C) 2022-${new Date().getFullYear()} roseal.live
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Repository: https://github.com/RoSeal-Extension/RoSeal
`;

const COMMON_COMMENT_BANNER = `/*${BASE_COMMENT_BANNER}*/`;
const HTML_COMMENT_BANNER = `<!--${BASE_COMMENT_BANNER}-->`;

export async function compileSCSSFile(
	outDir: string,
	path: string,
	env: Record<string, unknown>,
	isDev?: boolean,
) {
	const isDevSheet = path.includes("_dev");
	const isDisabled = path.includes("_disabled");

	if (!isDisabled && (!isDevSheet || isDev)) {
		const result = await sass.compileAsync(path, {
			style: isDev ? "expanded" : "compressed",
			functions: {
				"env($name)": (args) => {
					const name = args[0].assertString().text;
					const value = env[name];
					if (value === undefined) {
						throw new Error(`Environment variable ${name} is not set.`);
					}
					if (typeof value === "string") {
						return new sass.SassString(value);
					}
					if (typeof value === "boolean") {
						return value ? sass.sassTrue : sass.sassFalse;
					}
					if (typeof value === "number") {
						return new sass.SassNumber(value);
					}
					return sass.sassNull;
				},
			},
		});
		const outputPath = join(
			outDir,
			"css",
			relative(SCSS_ENTRYPOINT, path).replace(/\.(scss|sass)$/i, ".css"),
		);

		await Bun.write(outputPath, `${COMMON_COMMENT_BANNER}\n${result.css}`);
	}
}

export type CompileSCSSProps = {
	outDir: string;
	target: Target;
	targetBase: TargetBase;
	manifest?: Manifest;
	isDev?: boolean;
	paths?: string[];
	devServers: DevServersAvailable;
};

export function compileSCSS({
	outDir,
	target,
	targetBase,
	manifest: _manifest,
	isDev,
	paths,
	devServers,
}: CompileSCSSProps) {
	return updateLog(
		(async () => {
			const manifest = _manifest ?? (await getManifest());
			const env = getEnvironmentVariables({
				isDev,
				manifest,
				target,
				targetBase,
				devServers,
			});
			await emptyDir(`${outDir}/css/`);

			const promises = [];
			if (paths) {
				for (const path of paths) {
					promises.push(compileSCSSFile(outDir, path, env, isDev));
				}
			} else {
				for await (const entry of walk(SCSS_ENTRYPOINT)) {
					if (!entry.stats.isFile()) continue;
					promises.push(compileSCSSFile(outDir, entry.path, env, isDev));
				}
			}

			await Promise.all(promises);
		})(),
		"SASS compilation",
	);
}

function replaceTextVariable(
	target: Target,
	text: string,
	isDev?: boolean,
	devServers?: DevServersAvailable,
) {
	const {
		ROBLOX_DOMAIN,
		ROSEAL_DOMAIN,
		ROBLOX_CDN_DOMAIN,
		ROSEAL_WEBSITE_DOMAIN,
		ROLIMONS_DOMAIN,
	} = getDomains(target, isDev, devServers);

	return text
		.replaceAll(/{ROBLOX_DOMAIN\('(.+?)'\)}/g, ROBLOX_DOMAIN.replace("{service}", "$1"))
		.replaceAll(/{ROBLOX_CDN_DOMAIN\('(.+?)'\)}/g, ROBLOX_CDN_DOMAIN.replace("{service}", "$1"))
		.replaceAll(/{ROSEAL_DOMAIN\('(.+?)'\)}/g, ROSEAL_DOMAIN.replace("{service}", "$1"))
		.replaceAll(
			/{ROSEAL_WWW_URL}/g,
			`${isDev && devServers?.IS_DEV_WWW_ACCESSIBLE ? "http" : "https"}://${ROSEAL_WEBSITE_DOMAIN}`,
		)
		.replaceAll(/{ROLIMONS_DOMAIN\('(.+?)'\)}/g, ROLIMONS_DOMAIN.replace("{service}", "$1"))
		.replaceAll(/{ROSEAL_TRACKING_HEADER_NAME}/g, ROSEAL_TRACKING_HEADER_NAME);
}

export type WriteDNRRuleProps = {
	outDir: string;
	target: Target;
	isDev?: boolean;
	devServers: DevServersAvailable;
	robloxVersion?: string;
	version: string;
	cspPolicy: string;
};

export function writeDNRRules({
	outDir,
	target,
	isDev,
	version,
	devServers,
	robloxVersion,
	cspPolicy,
}: WriteDNRRuleProps) {
	const { ROBLOX_DOMAIN, FLUENTUI_EMOJI_BASE_URL, TWEMOJI_EMOJI_BASE_URL } = getDomains(
		target,
		isDev,
		devServers,
	);

	const userAgentOverrides = getUserAgentOverrides(robloxVersion);

	const appendString = `RoSealExtension (RoSeal/${target}/${version}/${isDev ? "dev" : "prod"})`;

	let idx = STATIC_RULES_START_ID;

	return updateLog(
		Bun.write(
			join(outDir, "dnr_rules.json"),
			replaceTextVariable(
				target,
				JSON.stringify([
					...userAgentOverrides.map((item) => ({
						id: idx++,
						priority: 1,
						action: {
							type: "modifyHeaders",
							requestHeaders: [
								{
									header: "user-agent",
									operation: "set",
									value: `${item.userAgent} ${appendString}`,
								},
							],
						},
						condition: {
							urlFilter: `||${ROBLOX_DOMAIN.replace(/{service}\.?/, "")}/*${ROSEAL_OVERRIDE_PLATFORM_TYPE_HEADER_NAME}=${item.platformType}`,
							resourceTypes: ["xmlhttprequest"],
						},
					})),
					{
						id: idx++,
						priority: 1,
						action: {
							type: "modifyHeaders",
							responseHeaders: [
								{
									header: CONTENT_SECURITY_POLICY_HEADER_NAME,
									operation: "set",
									value: cspPolicy.replace(
										"img-src 'self'",
										`img-src 'self' ${TWEMOJI_EMOJI_BASE_URL} ${FLUENTUI_EMOJI_BASE_URL}`,
									),
								},
							],
						},
						condition: {
							urlFilter: `||${ROBLOX_DOMAIN.replace(/{service}/, "www")}/*`,
							resourceTypes: ["main_frame", "sub_frame"],
						},
					},
					{
						id: idx++,
						priority: 1,
						action: {
							type: "modifyHeaders",
							requestHeaders: [
								{
									header: "user-agent",
									operation: "append",
									value: appendString,
								},
							],
						},
						condition: {
							urlFilter: `||${ROBLOX_DOMAIN.replace(/{service}\.?/, "")}/*${ROSEAL_TRACKING_HEADER_NAME}`,
							resourceTypes: ["xmlhttprequest"],
						},
					},
				]),
				isDev,
				devServers,
			),
		),
		"Write DNR Rules",
	);
}

export function getManifest(): Promise<Manifest> {
	return updateLog(Bun.file("./src/manifest.jsonc").text().then(parseJSONC), "Parse manifest");
}

export type WriteManifestProps = {
	outDir: string;
	targetBase: TargetBase;
	target: Target;
	manifest?: Manifest;
	isDev?: boolean;
	devServers: DevServersAvailable;
};

export function writeManifest({
	outDir,
	targetBase,
	target,
	manifest: _manifest,
	isDev,
	devServers,
}: WriteManifestProps) {
	return updateLog(
		(async () => {
			const manifest = _manifest ?? (await getManifest());
			await Bun.write(
				join(outDir, "manifest.json"),
				replaceTextVariable(
					target,
					JSON.stringify(
						transformManifest({
							manifest,
							targetBase,
							isDev,
							devServers,
						}),
					),
					isDev,
					devServers,
				),
			);
		})(),
		"Write to manifest",
	);
}

export type BuildJSProps = {
	outDir: string;
	target: Target;
	targetBase: TargetBase;
	manifest?: Manifest;
	isDev?: boolean;
	devServers: DevServersAvailable;
	paths?: string[];
};

export function buildJS({
	outDir,
	target,
	targetBase,
	manifest: _manifest,
	isDev,
	devServers,
	paths,
}: BuildJSProps) {
	return updateLog(
		(async () => {
			const manifest = _manifest ?? (await getManifest());
			const pagesPlugin = buildPagesPlugin(
				[
					{ dir: "src/ts/pages/main", index: "pages", importName: "main" },
					{
						dir: "src/ts/pages/background-listeners",
						index: "messageListeners",
						importName: "background-listeners",
					},
					{
						dir: "src/ts/pages/background-alarms",
						index: "alarmListeners",
						importName: "background-alarms",
					},
					{
						dir: "src/ts/pages/main-listeners",
						index: "messageListeners",
						importName: "main-listeners",
					},
					{ dir: "src/ts/pages/inject", index: "pages", importName: "inject" },
				],
				isDev,
			);
			const svgr = svgrPlugin({ svgProps: { fill: "currentColor" } });

			const entrypoints = paths ?? (await readdir(TS_ENTRYPOINT));

			await Promise.all(
				entrypoints.map((name) =>
					Bun.build(
						getBuildOptions({
							banner: COMMON_COMMENT_BANNER,
							target,
							targetBase,
							isDev,
							devServers,
							manifest,
							outDir,
							entrypoint: join(TS_ENTRYPOINT, name),
							// @ts-expect-error: Fine, compatible interface
							plugins: [pagesPlugin, svgr],
						}),
					),
				),
			);

			for await (const file of walk(join(outDir, "js"))) {
				if (!file.stats.isFile()) continue;
				if (basename(file.path) === ".DS_Store") {
					await remove(file.path);
				}
			}
		})(),
		"Build JS",
	);
}

export type CopyAssetsProps = {
	outDir: string;
	manifest?: Manifest;
	isDev?: boolean;
};

export function copyAssets({ outDir, isDev, manifest: _manifest }: CopyAssetsProps) {
	return updateLog(
		(async () => {
			const manifest = _manifest ?? (await getManifest());

			if (await exists("LICENSE")) {
				await copy("LICENSE", join(outDir, "LICENSE"));
			}

			if (await exists("./src/img")) {
				await Promise.all([
					copy("./src/img/", join(outDir, "img/")),
					copy("./src/fonts", join(outDir, "fonts/")),
				]);

				const files: walk.Item[] = [];
				for await (const file of walk(join(outDir, "img/"))) {
					if (!file.stats.isFile()) continue;
					files.push(file);
				}

				files.sort((a) => (a.path.includes("_beta") || a.path.includes("_dev") ? 1 : -1));

				for (const file of files) {
					const ext = extname(file.path);
					if (ext) {
						if (isDev || manifest.beta) {
							const distFile = file.path.replace(
								ext,
								`${isDev ? "_dev" : "_beta"}${ext}`,
							);
							if (await exists(distFile)) {
								await remove(file.path);
								await move(distFile, file.path);
							}
						}
						if (
							basename(file.path).includes("_dev") ||
							basename(file.path).includes("_beta")
						) {
							await remove(file.path);
						}
					}
				}
			}
		})(),
		"Copy assets",
	);
}

export type WriteI18nProps = { outDir: string };

export function writeI18n({ outDir }: WriteI18nProps) {
	return updateLog(
		(async () => {
			const writeTypes = getI18nTypesFile().then((data) =>
				Bun.write("./src/types/i18n.gen.d.ts", data),
			);

			for await (const file of walk("./src/i18n/locales/")) {
				if (!file.stats.isFile()) continue;

				const data = parseJSONC(await Bun.file(file.path).text()) as I18nFile;

				const filePath = join(
					outDir,
					"_locales",
					file.path.split("src/i18n/locales/")[1].replace(/-/g, "_"),
				);

				await ensureDir(parsePath(filePath).dir);
				await Bun.write(filePath, JSON.stringify(handleI18NNamespace(data, ["manifest"])));
			}
			await writeTypes;
		})(),
		"I18n parse and write",
	);
}

export type WriteHTMLFilesProps = {
	outDir: string;
	target: Target;
	isDev?: boolean;
};

export function writeHTMLFiles({ outDir, target, isDev }: WriteHTMLFilesProps) {
	return updateLog(
		(async () => {
			for await (const file of walk("./src/html/")) {
				if (!file.stats.isFile()) continue;

				const parsedPath = parsePath(file.path);
				const data = replaceTextVariable(target, await Bun.file(file.path).text(), isDev);

				await Bun.write(
					join(outDir, "html", `${parsedPath.name}${parsedPath.ext}`),
					`${HTML_COMMENT_BANNER}\n${
						isDev
							? data
							: await minifyHTML(data, {
									removeAttributeQuotes: true,
									collapseWhitespace: true,
									removeOptionalTags: true,
									removeComments: true,
								})
					}`,
				);
			}
		})(),
		"HTML files minify and write",
	);
}

export async function convertToSafariExtension(outDir: string) {
	if (process.platform !== "darwin") return;
	return updateLog(
		Bun.$`xcrun safari-web-extension-converter --copy-resources --project-location ./dist-safari/ --macos-only --no-open --app-name RoSeal --no-prompt --bundle-identifier com.roseal.roseal ${outDir}`.then(
			async () => {
				await remove(outDir);
				await rename("./dist-safari/RoSeal", outDir);
				await remove("./dist-safari/");
			},
		),
		"Convert to Safari Extension",
	);
}

export type BuildArgs = {
	outDir: string;
	target: Target;
	targetBase: TargetBase;
	isDev: boolean;
	devServers: DevServersAvailable;
	robloxVersion?: string;
	cspPolicy: string;
};

export async function build({
	target,
	targetBase,
	isDev,
	devServers,
	outDir,
	robloxVersion,
	cspPolicy,
}: BuildArgs) {
	console.info(
		`Building RoSeal for ${target} ${kleur.gray(
			`[${targetBase}, ${isDev ? "development" : "production"}]`,
		)}`,
	);

	await emptyDir(outDir);
	await mkdir(join(outDir, "js"));

	const manifest = await getManifest();

	const tasks: (Promise<unknown> | unknown)[] = [
		buildJS({ outDir, target, targetBase, manifest, isDev, devServers }),
		writeManifest({ target, outDir, targetBase, manifest, isDev, devServers }),
		copyAssets({ outDir, isDev }),
		writeDNRRules({
			outDir,
			target,
			version: manifest.version,
			isDev,
			devServers,
			robloxVersion,
			cspPolicy,
		}),
		writeI18n({ outDir }),
		writeHTMLFiles({ outDir, target, isDev }),
		compileSCSS({ outDir, target, targetBase, manifest, isDev, devServers }),
	];

	const result = await Promise.allSettled(tasks);
	if (result.every((r) => r.status === "fulfilled")) {
		if (targetBase === "apple") {
			await convertToSafariExtension(outDir);
		}
	} else {
		throw "Build failed with errors";
	}
}

export function getBuildArgs() {
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			target: { type: "string", default: "chrome" },
			release: { type: "boolean", default: false },
		},
		allowPositionals: true,
	});

	const isDev = values.release !== true;
	const target = values.target?.toLowerCase() as Target;

	if (!TARGETS.includes(target)) {
		throw `--target must be one of: ${TARGETS.join(", ")}`;
	}

	return {
		isDev,
		target,
		targetBase: getTargetBaseFromTarget(target),
	};
}

if (import.meta.main) {
	const { target, targetBase, isDev } = getBuildArgs();

	const devServers = await getDevServersAvailable(isDev);
	const { robloxVersion, cspPolicy } = await getBuildTimeParams(target, isDev);

	await updateLog(
		build({
			target,
			targetBase,
			isDev,
			outDir: DEFAULT_OUTDIR,
			robloxVersion,
			devServers,
			cspPolicy,
		}),
		"Build complete",
		"Build failed with errors",
	);
}
