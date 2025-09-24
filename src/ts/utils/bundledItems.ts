import { asLocaleLowerCase } from "../helpers/i18n/intlFormats";
import { type Agent, multigetDevelopAssetsByIds } from "../helpers/requests/services/assets";
import { getOutfitById } from "../helpers/requests/services/avatar";
import type { BundledItem } from "../helpers/requests/services/marketplace";
import { getAssetTypeData } from "./itemTypes";
import { escapeRegExp } from "./regex";

export async function getCorrectBundledItems(
	bundleName: string,
	bundleCreatorType: Agent,
	bundleCreatorId: number,
	bundledItems: BundledItem[],
) {
	const correctBundledItems: BundledItem[] = [];

	const assetIds: number[] = [];
	for (const item of bundledItems) {
		if (item.type === "Asset") {
			assetIds.push(item.id);
		}
	}

	const itemsData = await multigetDevelopAssetsByIds({
		assetIds,
	});
	if (itemsData.length !== assetIds.length) throw "Not enough assets fetched";
	let originalName: string | undefined;
	for (const item of itemsData) {
		// Step 1 - match name with bundle name (replace # with .) and determine the original name of the bundle

		const split = item.name.split(" - ");
		if (split.length !== 2) {
			continue;
		}

		if (
			new RegExp(asLocaleLowerCase(escapeRegExp(split[0]).replaceAll("#", ".")), "i").test(
				asLocaleLowerCase(bundleName),
			) ||
			originalName === split[0]
		) {
			correctBundledItems.push(
				bundledItems.find((item2) => item2.type === "Asset" && item2.id === item.id)!,
			);
		}

		if (!originalName) {
			originalName = split[0];
		}
	}

	// Step 2 - match item if its not usually a template asset and the creator matches
	for (const item of itemsData) {
		const typeData = getAssetTypeData(item.typeId);
		if (
			!typeData?.isUsuallyTemplate &&
			!typeData?.isAnimated &&
			bundleCreatorType === item.creator.type &&
			bundleCreatorId === item.creator.targetId
		) {
			correctBundledItems.push(
				bundledItems.find((item2) => item2.type === "Asset" && item2.id === item.id)!,
			);
		}
	}

	const promises: Promise<void>[] = [];
	for (const outfit of bundledItems) {
		if (outfit.type === "UserOutfit") {
			promises.push(
				getOutfitById({
					outfitId: outfit.id,
				}).then((data) => {
					if (data.isEditable) return;

					for (const item of data.assets) {
						for (const item2 of correctBundledItems) {
							if (item2.id === item.id) {
								correctBundledItems.push(outfit);
								return;
							}
						}
					}
				}),
			);
		}
	}

	await Promise.all(promises);

	return correctBundledItems;
}
