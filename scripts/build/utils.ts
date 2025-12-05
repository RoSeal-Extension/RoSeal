import {
	type MessageFormatElement,
	parse as parseMessage,
} from "@formatjs/icu-messageformat-parser";
import type { BuildConfig, BunPlugin } from "bun";
import { parse as parseJSONC } from "jsonc-parser";
import walk from "klaw";
import kleur from "kleur";
import { basename, dirname, parse as parsePath } from "node:path/posix";
import {
	DEV_SERVER_API_PORT,
	DEV_SERVER_WWW_PORT,
	type Env,
	getDomains,
	type I18nDetail,
	type I18nEnv,
	type I18nFile,
	type Manifest,
	type Target,
	type TargetBase,
} from "./constants.ts";
import rosealPlugins from "./plugins/rosealPlugins.ts";

export const CONTENT_SECURITY_POLICY_HEADER_NAME = "content-security-policy";

export function updateLog<T extends Promise<unknown>>(
	promise: T,
	text: string,
	failText?: string,
): T {
	const timeStart = performance.now();

	promise
		.then((res) => {
			console.info(
				`${kleur.green("✔")} ${text} ${kleur.gray(
					`[${(performance.now() - timeStart).toFixed(2)}ms]`,
				)}`,
			);
			return res;
		})
		.catch(() => {
			console.error(`${kleur.red("✘ error")} ${failText ?? text}`);
		});

	return promise;
}

export function getTargetBaseFromTarget(target: Target): TargetBase {
	switch (target) {
		case "chrome":
		case "edge": {
			return "chromium";
		}

		case "firefox": {
			return "firefox";
		}

		case "safari": {
			return "apple";
		}
	}
}

export type BuildPagesArgs = {
	dir: string;
	isDev?: boolean;
	index: string;
	type?: string;
	typePath?: string;
};

export async function buildPages({
	isDev,
	dir,
	index,
	type,
	typePath,
}: BuildPagesArgs): Promise<string> {
	let imports = type && typePath ? `import type { ${type} } from "${typePath}";` : undefined;
	let exports = `export const ${index}${type ? `: ${type}[]` : ""} = [`;
	let fileNumber = 1;

	const files: walk.Item[] = [];
	for await (const file of walk(dir)) {
		if (file.stats.isFile()) {
			files.push(file);
		}
	}

	// Sort files, need to stay same order on all OSes to be platform agnostic
	files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 0 : 1));

	for (const file of files) {
		const fileName = file.path;
		const isDevPage = fileName.includes("_dev");
		const isDisabled = fileName.includes("_disabled");

		if ((!isDevPage || isDev) && !isDisabled) {
			const imported = `file${fileNumber++}`;
			imports += `\nimport ${imported} from "${fileName}";`;
			exports += `\n    ${imported},`;
		}
	}
	exports += "\n];\n";

	return `${imports?.trim()}\n\n${exports}`;
}

export type TransformManifestArgs = {
	manifest: Manifest;
	targetBase: TargetBase;
	isDev?: boolean;
	devServers?: DevServersAvailable;
};

export function transformManifest({
	manifest: _manifest,
	targetBase,
	isDev = false,
	devServers,
}: TransformManifestArgs) {
	let manifest = structuredClone(_manifest);
	manifest.$schema = undefined;

	if (manifest.web_accessible_resources && !isDev) {
		for (const data of manifest.web_accessible_resources) {
			data.resources = data.resources.filter((item) => !item.endsWith(".map"));
		}
		manifest.web_accessible_resources = manifest.web_accessible_resources.filter(
			(item) => item.resources.length > 0,
		);
		if (manifest.web_accessible_resources.length === 0) {
			manifest.web_accessible_resources = undefined;
		}
	}

	if (devServers && isDev) {
		manifest.host_permissions ??= [];
		manifest.host_permissions.push("*://localhost/*");
	}

	if (manifest.beta && !isDev) {
		manifest.short_name = "RoSeal BETA";
		manifest.name = "RoSeal BETA";
	}

	if (targetBase !== "firefox") {
		manifest = {
			...manifest,
			options_ui: undefined,
			// @ts-expect-error: Replacing
			store_version: undefined,
			version: manifest.store_version,
			version_name: manifest.version_name?.replace("__manifest_version__", manifest.version),
		};
	} else {
		manifest = {
			...manifest,
			// @ts-expect-error: Replacing
			store_version: undefined,
			version: manifest.store_version,
			// @ts-expect-error: Manifest V2 for firefox
			manifest_version: 2,
			version_name: undefined,
			host_permissions: undefined,
			optional_host_permissions: undefined,
			// @ts-expect-error: For firefox, permissions can be a string
			optional_permissions: [
				...(manifest.optional_host_permissions ?? []),
				...(manifest.optional_permissions ?? []),
			],
			// @ts-expect-error: For firefox, permissions can be a string
			permissions: [...(manifest.host_permissions ?? []), ...(manifest.permissions ?? [])],
			action: undefined,
			browser_action: manifest.action,
			incognito: "spanning",
			background: manifest.background && {
				// @ts-expect-error: Mapping to firefox background
				scripts: [manifest.background.service_worker],
			},
			// @ts-expect-error: Mapping to firefox resources
			web_accessible_resources: manifest.web_accessible_resources?.flatMap(
				(resources) => resources.resources,
			),
		};
	}

	if (manifest.browser_specific_settings) {
		switch (targetBase) {
			case "apple": {
				manifest.browser_specific_settings = {
					safari: manifest.browser_specific_settings.safari,
				};
				break;
			}
			case "chromium": {
				if (isDev) manifest.key = manifest.browser_specific_settings.chrome?.key;

				manifest.minimum_chrome_version =
					manifest.browser_specific_settings.chrome?.strict_min_version;
				manifest.browser_specific_settings = undefined;
				break;
			}
			case "firefox": {
				let id: string | undefined;
				let updateUrl: string | undefined;

				if (!isDev) {
					if (manifest.beta) {
						id = manifest.browser_specific_settings.firefox?.beta_id;
						updateUrl = manifest.browser_specific_settings.firefox?.beta_id;
					} else {
						id = manifest.browser_specific_settings.firefox?.id;
					}
				}

				if (manifest.browser_specific_settings.firefox) {
					manifest.browser_specific_settings.firefox.beta_id = undefined;
					manifest.browser_specific_settings.firefox.beta_update_url = undefined;
				}

				manifest.browser_specific_settings = {
					// @ts-expect-error: Mapping to firefox browser_specific_settings
					gecko: manifest.browser_specific_settings.firefox && {
						...manifest.browser_specific_settings.firefox,
						id,
						update_url: updateUrl,
						android: undefined,
					},
					gecko_android: manifest.browser_specific_settings.firefox?.android,
				};
				break;
			}
		}
	}

	if (targetBase === "apple") {
		manifest.incognito = undefined;
		manifest.optional_permissions = manifest.optional_permissions?.filter(
			(item: string) => item !== "cookies",
		);
	}

	manifest.beta = undefined;

	return manifest;
}

export type GetEnvironmentVariablesArgs = {
	entrypoint?: string;
	manifest: Manifest;
	isDev?: boolean;
	target: Target;
	targetBase: TargetBase;
	devServers: DevServersAvailable;
};

export function getEnvironmentVariables({
	entrypoint,
	manifest,
	isDev,
	target,
	targetBase,
	devServers,
}: GetEnvironmentVariablesArgs) {
	return {
		ENV: entrypoint && getEntrypointName(entrypoint),
		IS_DEV: isDev === true,
		IS_BETA: manifest.beta === true,
		TARGET: target,
		TARGET_BASE: targetBase,
		VERSION: manifest.version,
		BASE_STORAGE_TYPE: "local",
		VERSION_NAME: manifest.version_name?.replaceAll("__manifest_version__", manifest.version),
		...getDomains(target, isDev, devServers),
		...devServers,
	};
}

export type GetBuildOptionsArgs = {
	banner: string;
	target: Target;
	targetBase: TargetBase;
	isDev?: boolean;
	devServers: DevServersAvailable;
	manifest: Manifest;
	entrypoint: string;
	outDir: string;
	plugins?: BunPlugin[];
};

export function getBuildOptions({
	banner,
	target,
	targetBase,
	isDev = false,
	devServers,
	manifest,
	outDir,
	entrypoint,
	plugins,
}: GetBuildOptionsArgs): BuildConfig {
	const env = getEnvironmentVariables({
		entrypoint,
		manifest,
		isDev,
		devServers,
		target,
		targetBase,
	});
	const define: Record<string, string> = {
		browser: "globalThis.browser",
		addEventListener: "globalThis.addEventListener",
		devicePixelRatio: "globalThis.devicePixelRatio",
		i: "globalThis.i",
		bval: "globalThis.bval",
		gval: "globalThis.gval",
	};
	for (const key in env) {
		define[`import.meta.env.${key}`] = JSON.stringify(env[key as keyof typeof env]);
	}

	if (targetBase === "chromium") {
		define.browser = "globalThis.chrome";
	}

	return {
		target: "browser",
		throw: true,
		entrypoints: [entrypoint],
		banner: isDev ? undefined : banner,
		plugins: [
			...rosealPlugins({
				target,
				targetBase,
				isDev,
				manifest,
				entrypoint: getEntrypointName(entrypoint),
			}),
			...(plugins ?? []),
		],
		define,
		outdir: `${outDir}/js`,
		format: getEntrypointName(entrypoint) === "inject" ? "iife" : "esm",
		// DEV BUG: setting minify to false will use development packages...
		// there's a bug with react-bootstrap v1 that will cause animations from Modals and Tooltips to
		// stack overflow with getComputedStyles. RoSeal v1 did not have this bug because it always used
		// production packages with esm.sh.
		minify: true,
		// Bun sourcemaps are currently garbage. References the incorrect lines and columns
		// sourcemap: isDev ? "external" : undefined,
	};
}

export function getEntrypointName(entrypoint: string): Env {
	return parsePath(entrypoint).name as Env;
}

export function handleI18NNamespace(
	data: Record<string, I18nDetail | string>,
	types?: I18nEnv[],
	namespace?: string,
	_transform?: Record<
		string,
		{
			$context?: string;
			message?: string;
		}
	>,
	includeContext = false,
	currentContext?: string,
) {
	const transform = _transform ?? {};

	for (const key in data) {
		const value = data[key];
		let setKey = namespace ? `${namespace}.${key}` : key;

		if (types?.includes("manifest") && types.length === 1) {
			setKey = setKey.replaceAll(".", "_");
		}

		if (typeof key === "string" && key.startsWith("$")) {
			/*
			if (key === "$context" && includeContext && value) {
				setKey = setKey.replace(".$context", "");
				transform[setKey] ??= {};
				// @ts-expect-error: Fine
				transform[setKey].$context = value;
			}*/
			continue;
		}

		if (typeof value === "string") {
			if (!value.length) {
				continue;
			}

			transform[setKey] = {
				message: value,
			};
		} else if (typeof value === "object") {
			if (
				types &&
				!(value.$types ?? ["main"])?.some((type) => types.includes(type)) &&
				(!!value.$types || !_transform)
			) {
				continue;
			}

			if (value.$message?.length) {
				transform[setKey] ??= {};

				if (includeContext) {
					transform[setKey].$context =
						`${currentContext ? `${currentContext}; ` : ""}${value.$context || key}`;
				}
				transform[setKey].message = value.$message;
			}

			let nextContext: string | undefined = includeContext ? currentContext : undefined;
			if (includeContext) {
				nextContext = `${currentContext ? `${currentContext}; ` : ""}${value.$context ?? key}`;
			}

			handleI18NNamespace(value, types, setKey, transform, includeContext, nextContext);
		}
	}

	return transform;
}

export async function getI18nExport(entrypoints: Env[], includeContext = false) {
	let contents: Record<
		string,
		{
			[key: string]: string | undefined;
			$context?: string;
		}
	> = {};
	const supportedLocales = [];

	for await (const file of walk("./src/i18n/locales/")) {
		if (!file.stats.isFile()) {
			continue;
		}
		const localeName = basename(dirname(file.path));

		const data = parseJSONC(await Bun.file(file.path).text()) as I18nFile;
		supportedLocales.push(localeName);

		const extractedData = handleI18NNamespace(
			data,
			entrypoints,
			undefined,
			undefined,
			includeContext,
		);
		for (const key in extractedData) {
			contents[key] ??= {};
			if (includeContext) contents[key].$context = extractedData[key].$context;

			if (extractedData[key].message) contents[key][localeName] = extractedData[key].message;
		}
	}

	// Ensure output is consistent across all systems
	for (const key in contents) {
		contents[key] = Object.fromEntries(Object.entries(contents[key]).sort());
	}

	contents = Object.fromEntries(Object.entries(contents).sort());

	return {
		contents,
		supportedLocales,
	};
}

export function getI18nTypesFile() {
	return Bun.file("./src/i18n/locales/en/messages.json")
		.text()
		.then(parseJSONC)
		.then((data) => handleI18NNamespace(data, ["main", "inject", "popup", "background"]))

		.then(async (data) => {
			const extracted = Object.entries(data).map(([key, value]) => {
				const handleItem = (
					item: MessageFormatElement,
				): MessageFormatElement[] | MessageFormatElement => {
					if ("options" in item) {
						return [
							item,
							...Object.values(item.options).flatMap((item) =>
								item.value.flatMap(handleItem),
							),
						];
					}

					if ("children" in item) {
						return [item, ...item.children.flatMap(handleItem)];
					}

					return item;
				};

				const args = value.message
					? parseMessage(value.message)
							.flatMap(handleItem)
							.filter((item) => item.type !== 0 && "value" in item)
					: [];

				const handledKeys: string[] = [];

				return `"${key}": ${
					args.length
						? `{ ${args
								.filter((item) => {
									if ("value" in item && item.value) {
										if (handledKeys.includes(item.value)) {
											return false;
										}

										handledKeys.push(item.value);
										return true;
									}
									return false;
								})
								.map((item) => `"${"value" in item && item.value}": unknown`)
								.join("; ")} }`
						: "void"
				}`;
			});
			const overrides = await import("../../src/ts/helpers/i18n/overrideMessages");
			for (const key in overrides.default) {
				extracted.push(`"${key}": any`);
			}

			return `declare module "#i18n/types" { export default {} as { ${extracted.join(
				"; ",
			)}} }`;
		});
}

export type DevServersAvailable = {
	IS_DEV_API_ACCESSIBLE: boolean;
	IS_DEV_WWW_ACCESSIBLE: boolean;
	IS_DEV_WS_ACCESSIBLE: boolean;
};

export function getDevServersAvailable(
	isDev: boolean,
	isWsAccessible?: boolean,
): Promise<DevServersAvailable> {
	if (!isDev) {
		return Promise.resolve({
			IS_DEV_API_ACCESSIBLE: false,
			IS_DEV_WWW_ACCESSIBLE: false,
			IS_DEV_WS_ACCESSIBLE: false,
		});
	}

	return Promise.allSettled([
		fetch(`http://localhost:${DEV_SERVER_API_PORT}`),
		fetch(`http://localhost:${DEV_SERVER_WWW_PORT}`),
	]).then(([api, www]) => {
		return {
			IS_DEV_API_ACCESSIBLE: api.status === "fulfilled",
			IS_DEV_WWW_ACCESSIBLE: www.status === "fulfilled",
			IS_DEV_WS_ACCESSIBLE: isWsAccessible === true,
		};
	});
}

export type BuildTimeParams = {
	robloxVersion: string;
	cspPolicy: string;
};

export async function getBuildTimeParams(
	target?: Target,
	isDev?: boolean,
	devServersAvailable?: DevServersAvailable,
): Promise<BuildTimeParams> {
	const cachedBuildTime = Bun.file("cachedBuildTime.json");
	if (await cachedBuildTime.exists()) {
		return cachedBuildTime.json();
	}
	const { ROBLOX_DOMAIN } = getDomains(target, isDev, devServersAvailable);

	return Promise.all([
		fetch(
			`https://${ROBLOX_DOMAIN.replace("{service}", "clientsettingscdn")}/v2/client-version/WindowsPlayer`,
		).then((res) => res.json()),
		fetch(`https://${ROBLOX_DOMAIN.replace("{service}", "www")}/home`),
	]).then(([clientVersion, loginPage]) => {
		return {
			robloxVersion:
				typeof clientVersion === "object" &&
				clientVersion !== null &&
				"version" in clientVersion &&
				typeof clientVersion.version === "string"
					? clientVersion.version
					: "unknown",
			cspPolicy: loginPage.headers.get(CONTENT_SECURITY_POLICY_HEADER_NAME) ?? "",
		};
	});
}

export function normalizePath(path: string) {
	return path.replaceAll("\\", "/");
}
