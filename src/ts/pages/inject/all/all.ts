import type { ExperimentsDiscoveredStorageValue } from "src/ts/constants/robloxExperiments";
import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackFunction } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { GUACPolicy } from "src/ts/helpers/requests/services/testService";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getRobloxUrl as getRobloxUrlNonMacro } from "src/ts/utils/baseUrls";

export default {
	id: "all",
	isAllPages: true,
	sites: ["dashboard", "docs", "roadmap", "store", "talent", "www"],
	fn: () => {
		hijackFunction(
			globalThis.history,
			(target, thisArg, args) => {
				if (args[2])
					queueMicrotask(() => {
						globalThis.dispatchEvent(new Event("urlchange"));
					});

				return target.apply(thisArg, args);
			},
			"pushState",
		);

		hijackFunction(
			globalThis.history,
			(target, thisArg, args) => {
				if (args[2])
					queueMicrotask(() => {
						globalThis.dispatchEvent(new Event("urlchange"));
					});

				return target.apply(thisArg, args);
			},
			"replaceState",
		);
		globalThis.addEventListener("popstate", () => {
			globalThis.dispatchEvent(new Event("urlchange"));
		});

		addMessageListener("experiments.setOverrides", ({ overrides, discoverExperiments }) => {
			const guacToSortedString: Record<string, string[]> = {};
			const clientSettingsToSortedString: Record<string, Record<string, string[]>> = {};

			const experimentsFound = new Set<{
				type: keyof ExperimentsDiscoveredStorageValue;
				parentId: string | number;
				id: string;
				parameters: string[];
			}>();

			const addToFound = (
				type: keyof ExperimentsDiscoveredStorageValue,
				parentId: string | number,
				id: string,
				keys: string[],
			) => {
				let found = false;
				for (const index of experimentsFound) {
					if (index.type === type && index.parentId === parentId && index.id === id) {
						found = true;
						for (const key of keys) {
							if (!index.parameters.includes(key)) {
								index.parameters.push(key);
							}
						}

						break;
					}
				}

				if (!found) {
					experimentsFound.add({
						type,
						parentId,
						id,
						parameters: keys,
					});
				}
			};

			if (discoverExperiments) {
				setInterval(() => {
					if (experimentsFound.size === 0) return;

					sendMessage("experiments.discovered", [...experimentsFound]);
					experimentsFound.clear();
				}, 2_000);

				const onIndex = (
					target: Record<string | number | symbol, unknown>,
					key: string | number | symbol,
					type: keyof ExperimentsDiscoveredStorageValue,
					parentId: number | string,
					id: string,
				) => {
					if (
						typeof key === "string" &&
						key !== "then" &&
						key !== "toString" &&
						key !== "toJSON"
					) {
						addToFound(type, parentId, id, [key]);
					}

					return target[key];
				};

				// biome-ignore lint/suspicious/noExplicitAny: Fine
				const handleJSON = (_: string, result: any) => {
					try {
						if (result && typeof result === "object") {
							if ("layers" in result && "projectId" in result) {
								const layers = result.layers;
								for (const layerName in layers) {
									const layer = layers[layerName];
									addToFound(
										"ixp",
										result.projectId,
										layerName,
										Object.keys(layer.parameters),
									);

									layer.parameters = new Proxy(layer.parameters, {
										get: (target, p: string) =>
											onIndex(target, p, "ixp", result.projectId, layerName),
									});
								}
							} else if (
								"results" in result &&
								Array.isArray(result.results) &&
								result.results[0] &&
								typeof result.results[0] === "object" &&
								"content" in result.results[0]
							) {
								for (const behavior of result.results as GUACPolicy<string>[]) {
									if (!behavior.content) {
										continue;
									}

									addToFound(
										"guac",
										"default",
										behavior.name,
										Object.keys(behavior.content),
									);

									behavior.content = new Proxy(behavior.content, {
										get: (target, p: string) =>
											onIndex(target, p, "guac", "default", behavior.name),
									});
								}
							} else if (result && typeof result === "object") {
								for (const key in guacToSortedString) {
									let matches = true;
									for (const key2 of guacToSortedString[key]) {
										if (!(key2 in result)) {
											matches = false;
											break;
										}
									}

									if (!matches) {
										continue;
									}

									addToFound("guac", "default", key, Object.keys(result));

									return new Proxy(result, {
										get: (target, p: string) =>
											onIndex(target, p, "guac", "default", key),
									});
								}

								if (!("applicationSettings" in result)) {
									return result;
								}

								for (const key in clientSettingsToSortedString) {
									for (const bucket in clientSettingsToSortedString[key]) {
										const matchBucket =
											clientSettingsToSortedString[key][bucket];
										let matches = true;
										for (const key2 of matchBucket) {
											if (!(key2 in result.applicationSettings)) {
												matches = false;
												break;
											}
										}

										if (!matches) {
											continue;
										}

										addToFound(
											"clientSettings",
											"default",
											key,
											Object.keys(result.applicationSettings),
										);

										result.applicationSettings = new Proxy(
											result.applicationSettings,
											{
												get: (target, p: string) =>
													onIndex(
														target,
														p,
														"clientSettings",
														bucket,
														key,
													),
											},
										);

										return result;
									}
								}
							}
						}
					} catch {}

					return result;
				};

				hijackFunction(
					JSON,
					(target, thisArg, args) => handleJSON(args[0], target.apply(thisArg, args)),
					"parse",
				);

				hijackFunction(
					Response.prototype,
					(_, thisArg, args) => {
						return thisArg.text.apply(thisArg, args).then((text) => {
							return JSON.parse(text);
						});
					},
					"json",
				);
			}

			const ixpRegex = /\/product-experimentation-platform\/v1\/projects\/(\d+)\/values$/;
			const ixpLayerRegex =
				/\/product-experimentation-platform\/v1\/projects\/(\d+)\/layers\/(.+)\/values$/;

			const guacRegex = /\/universal-app-configuration\/v1\/behaviors\/(.+)\/content$/;
			const guacV2Regex = /\/guac-v2\/v1\/bundles\/(.+)/;
			const multiGuacRegex = /\/universal-app-configuration\/v1\/behavior-contents$/;
			const clientSettingsRegex = /^\/v1\/settings\/application$/;
			const clientSettingsV2Regex = /^\/v2\/settings\/application\/(.+?)(\/bucket\/(.+?))?$/;
			const ampRegex = /^\/access-management\/v1\/upsell-feature-access$/;

			hijackResponse(async (req, res) => {
				if (!res) {
					return;
				}
				const url = new URL(req.url);

				let data = await res.clone().json();
				if (url.hostname === getRobloxUrl("apis")) {
					if (ampRegex.test(url.pathname)) {
						for (const override of overrides) {
							if (override.type === "amp") {
								for (const key in override.overrides) {
									if (key === url.searchParams.get("featureName")) {
										const returnValue = new Response(
											JSON.stringify({
												...override.overrides[key],
												featureName: key,
											}),
											res,
										);

										Object.defineProperty(returnValue, "status", {
											value: 200,
										});
										return returnValue;
									}
								}
							}
						}
					}

					const ixpMatch = ixpRegex.exec(url.pathname);
					if (ixpMatch) {
						for (const override of overrides) {
							if (override.type === "ixp" && override.ixpType === "override") {
								for (const layer in data.layers) {
									const layerData = data.layers[layer];

									const parametersOverride =
										override.overrides[data.projectId]?.[layer];
									if (parametersOverride) {
										layerData.parameters = {
											...layerData.parameters,
											...parametersOverride,
										};
									}
								}
							}
						}

						return new Response(JSON.stringify(data), res);
					}

					const ixpLayerMatch = ixpLayerRegex.exec(url.pathname);
					if (ixpLayerMatch) {
						const url = new URL(req.url);
						const parameters = url.searchParams.get("parameters")?.split(",");
						if (!parameters) {
							return;
						}

						const projectId = Number.parseInt(ixpLayerMatch[1], 10);
						if (discoverExperiments) {
							addToFound("ixp", projectId, ixpLayerMatch[2], parameters);
						}

						for (const override of overrides) {
							if (override.type === "ixp" && override.ixpType === "override") {
								const parametersOverride =
									override.overrides[projectId]?.[ixpLayerMatch[2]];
								if (parametersOverride) {
									for (const key in parametersOverride) {
										data[key] = parametersOverride[key];
									}
								}
							}
						}

						return new Response(JSON.stringify(data), res);
					}

					const guacMatch =
						guacRegex.exec(url.pathname) ?? guacV2Regex.exec(url.pathname);
					if (guacMatch) {
						const behavior = guacMatch[1];

						for (const override of overrides) {
							if (override.type === "guac" && override.guacType === "override") {
								const parametersOverride = override.overrides[behavior];
								if (parametersOverride) {
									for (const key in parametersOverride) {
										data[key] = parametersOverride[key];
									}
								}
							}
						}

						if (discoverExperiments) {
							const keys = Object.keys(data);
							if (keys.length > 0) {
								guacToSortedString[behavior] = data;
							}
						}

						return new Response(JSON.stringify(data), res);
					}

					if (multiGuacRegex.test(url.pathname)) {
						for (const override of overrides) {
							if (override.type === "guac" && override.guacType === "override") {
								for (const behaviorName in override.overrides) {
									const parametersOverride = override.overrides[behaviorName];
									if (parametersOverride) {
										for (const behavior of data.results) {
											if (behavior.name === behaviorName) {
												behavior.content = {
													...behavior.content,
													...parametersOverride,
												};
											}
										}
									}
								}
							}
						}

						return new Response(JSON.stringify(data), res);
					}
				} else if (
					(url.hostname === getRobloxUrl("clientsettings") ||
						url.hostname === getRobloxUrl("clientsettingscdn")) &&
					data.applicationSettings
				) {
					let applicationName = url.searchParams.get("applicationName");
					let bucketName = "default";
					const v1Match = clientSettingsRegex.exec(url.pathname);
					const v2Match = clientSettingsV2Regex.exec(url.pathname);
					if (v2Match) {
						applicationName = v2Match[1];
						bucketName = v2Match[3] || bucketName;
					}
					if ((v1Match || v2Match) && applicationName) {
						for (const override of overrides) {
							if (
								override.type === "clientSettings" &&
								override.clientSettingsType === "override"
							) {
								for (const overrideApplicationName in override.overrides) {
									if (overrideApplicationName === applicationName) {
										for (const key in override.overrides[
											overrideApplicationName
										]) {
											data.applicationSettings[key] =
												override.overrides[overrideApplicationName][key];
										}
									}
								}
							}
						}

						if (discoverExperiments) {
							const keys = Object.keys(data.applicationSettings);
							if (keys.length > 0) {
								clientSettingsToSortedString[applicationName] ??= {};
								clientSettingsToSortedString[applicationName][bucketName] = keys;
							}
						}

						return new Response(JSON.stringify(data), res);
					}
				}

				let statusCode = res.status;
				for (const override of overrides) {
					try {
						if (
							override.type === "json" &&
							new RegExp(override.match.regex).test(url.pathname) &&
							getRobloxUrlNonMacro(override.match.robloxSubdomain) === url.hostname &&
							(override.match.method ?? "get" === req.method.toLowerCase())
						) {
							if (override.statusCode) {
								statusCode = override.statusCode;
							}
							if (override.jsonType === "replace") {
								data = override.value;
								continue;
							}

							if (override.jsonType === "override") {
								data = {
									...data,
									...(override.value as Record<string, unknown>),
								};
								continue;
							}

							if (!override.match.field) {
								continue;
							}
							let field = data;
							for (const fieldPath of override.match.field.slice(
								0,
								override.jsonType === "push" ? -2 : -1,
							)) {
								if (!fieldPath) continue;

								field = field?.[fieldPath];
							}

							if (field) {
								if (override.jsonType === "push") {
									field.push(override.value);
								} else if (override.jsonType === "set") {
									field[override.match.field.at(-1)!] = override.value;
								}
							}
						}
					} catch {}
				}

				const returnValue = new Response(JSON.stringify(data), res);
				if (statusCode !== res.status) {
					Object.defineProperty(returnValue, "status", {
						value: statusCode,
					});
				}
				return returnValue;
			});
		});
	},
} satisfies Page;
