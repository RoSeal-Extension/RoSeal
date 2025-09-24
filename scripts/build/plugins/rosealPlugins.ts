import { join } from "node:path";
import type { BunPlugin } from "bun";
import type { Env, Manifest, Target, TargetBase } from "../constants.ts";
import { buildPages, getI18nExport } from "../utils.ts";

export type BuildPagesPluginArgs = {
	dir: string;
	index: string;
	importName: string;
};

export function buildPagesPlugin(_requests: BuildPagesPluginArgs[], isDev?: boolean): BunPlugin {
	const requests = _requests.map((value) => ({
		...value,
		value: buildPages({
			...value,
			isDev,
		}).catch(() => ""),
	}));

	return {
		name: "roseal-build-pages",
		setup: (build) => {
			for (const request of requests) {
				const namespace = `roseal-pages-replace-${request.importName}`;

				build.onResolve(
					{ filter: new RegExp(`^#pages/${request.importName}$`) },
					(args) => ({
						path: args.path,
						namespace,
					}),
				);

				build.onLoad(
					{
						filter: /.*/,
						namespace,
					},
					() =>
						request.value.then((contents) => ({
							contents,
						})),
				);
			}
		},
	};
}

export type RoSealPluginArgs = {
	target: Target;
	targetBase: TargetBase;
	isDev: boolean;
	manifest: Manifest;
	entrypoint: Env;
};

export default function rosealPlugins({ entrypoint }: RoSealPluginArgs): BunPlugin[] {
	return [
		{
			name: "roseal-plugin",
			setup: (build) => {
				// replace @preact/signals with @preact/signals-core if it's not in main script
				// because signals are cool, but we don't need preact in the background script/inject script
				if (entrypoint !== "main" && entrypoint !== "popup") {
					build.onResolve({ filter: /^@preact\/signals$/ }, () => ({
						path: join(
							process.cwd(),
							"node_modules/@preact/signals-core/dist/signals-core.js",
						),
					}));
				}

				build.onResolve({ filter: /#i18n/ }, (args) => ({
					path: args.path,
					namespace: "roseal-i18n-replace",
				}));

				build.onLoad(
					{
						filter: /.*/,
						namespace: "roseal-i18n-replace",
					},
					() =>
						getI18nExport([entrypoint]).then((data) => ({
							loader: "ts",
							contents: `export default ${JSON.stringify(
								data.contents,
							)}; export const supportedLocales = ${JSON.stringify(
								data.supportedLocales.sort(),
							)}`,
						})),
				);
			},
		},
	];
}
