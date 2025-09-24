import storageSignal from "src/ts/components/hooks/storageSignal";
import PreviewFilteredTextWidget from "src/ts/components/misc/PreviewFilteredTextWidget";
import {
	type ExperimentsDiscoveredStorageValue,
	type ExperimentsStorageValue,
	DISALLOWED_DOM_ATTRIBUTES,
	DISALLOWED_DOM_TAG_NAMES,
	EXPERIMENTS_DISCOVERED_STORAGE_KEY,
	EXPERIMENTS_STORAGE_KEY,
} from "src/ts/constants/robloxExperiments";
import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import {
	type RobloxExperimentVariable,
	getRobloxExperiments,
} from "src/ts/helpers/requests/services/roseal";
import { storage } from "src/ts/helpers/storage";
import { isIframe } from "src/ts/utils/context";
import { renderAppendBody } from "src/ts/utils/render";

export default {
	id: "all",
	isAllPages: true,
	sites: ["dashboard", "docs", "roadmap", "store", "talent", "www"],
	css: ["css/allSites.css"],
	runInIframe: true,
	fn: () => {
		// prevent iframes at this point
		if (isIframe) return;

		featureValueIs("previewFilteredTextWidget", true, () =>
			renderAppendBody(<PreviewFilteredTextWidget />),
		);

		featureValueIs("overrideRobloxExperiments", true, () => {
			const discoverExperiments = getFeatureValue(
				"overrideRobloxExperiments.discoverExperiments",
			);

			getRobloxExperiments().then((experimentSections) => {
				return storage
					.get(EXPERIMENTS_STORAGE_KEY)
					.then((storage) => storage[EXPERIMENTS_STORAGE_KEY])
					.then((data: ExperimentsStorageValue) => {
						if (!data) {
							return;
						}

						const experiments = experimentSections.flatMap(
							(section) => section.experiments,
						);

						for (const key in data.settings) {
							if (!experiments.find((e) => e.id === key)) {
								delete data.settings[key];
							}
						}

						const newOperations: RobloxExperimentVariable[] = [];
						for (const experiment of experiments) {
							const operations = experiment.buckets.find(
								(bucket) => bucket.id === data.settings[experiment.id],
							)?.operations;

							if (operations) {
								newOperations.push(...operations);
							}
						}
						data.operations = newOperations;

						return storage.set({
							[EXPERIMENTS_STORAGE_KEY]: data,
						});
					});
			});

			storage.get(EXPERIMENTS_STORAGE_KEY).then(async (data) => {
				const value: ExperimentsStorageValue = data[EXPERIMENTS_STORAGE_KEY] ?? {
					operations: [],
					settings: {},
				};

				const operations = value.operations;
				const nonDomOperations: RobloxExperimentVariable[] = [];
				for (const operation of operations) {
					if (operation.type === "dom") {
						watch(operation.selector, (el) => {
							if (operation.domType === "remove") {
								el.remove();
							} else if (operation.domType === "modify") {
								if (DISALLOWED_DOM_TAG_NAMES.includes(el.tagName.toLowerCase())) {
									return;
								}
								if (operation.attributes) {
									for (const attribute in operation.attributes) {
										if (
											DISALLOWED_DOM_ATTRIBUTES.includes(
												attribute.toLowerCase(),
											)
										) {
											continue;
										}
										if (operation.attributes[attribute] === null) {
											el.removeAttribute(attribute);
										} else {
											el.setAttribute(
												attribute,
												operation.attributes[attribute] as string,
											);
										}
									}
								}
								if (operation.classList) {
									if (operation.classList.add) {
										el.classList.add(...operation.classList.add);
									}
									if (operation.classList.remove) {
										el.classList.remove(...operation.classList.remove);
									}
								}
							}
						});
					} else {
						nonDomOperations.push(operation);
					}
				}

				return sendMessage("experiments.setOverrides", {
					overrides: nonDomOperations,
					discoverExperiments: await discoverExperiments,
				});
			});

			const [discovered, setDiscovered] = storageSignal<ExperimentsDiscoveredStorageValue>(
				EXPERIMENTS_DISCOVERED_STORAGE_KEY,
				{},
			);

			addMessageListener("experiments.discovered", async (newData) => {
				for (const data of newData) {
					discovered.value[data.type] ??= {};
					const type = discovered.value[data.type]!;
					type[data.parentId] ??= {};
					const parent = type[data.parentId];
					parent[data.id] ??= [];
					const parameters = [...new Set([...parent[data.id], ...data.parameters])];
					if (parent[data.id].length === parameters.length) {
						continue;
					}

					parent[data.id] = parameters;
				}

				return setDiscovered(discovered.value);
			});
		});
	},
} satisfies Page;
