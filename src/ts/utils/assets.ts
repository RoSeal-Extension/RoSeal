import { getOrSetCache } from "../helpers/cache";
import { assetDeliveryProcessor } from "../helpers/processors/assetDeliveryProcessor";
import { UNRETRYABLE_STATES } from "../helpers/processors/thumbnailProcessor";
import { httpClient, RESTError } from "../helpers/requests/main";
import { type GeneralAssetCreator, getAssetById } from "../helpers/requests/services/assets";
import type { SortOrder } from "../helpers/requests/services/badges";
import {
	type ListedUserCollectibleAsset,
	type ListedUserInventoryAsset,
	listOpenCloudUserInventoryItems,
	listUserCollectibleAssets,
	listUserInventoryAssets,
	type OpenCloudInventoryItem,
} from "../helpers/requests/services/inventory";
import { getAvatarItem, type MarketplaceItemType } from "../helpers/requests/services/marketplace";
import { get3dThumbnail, getUser3dThumbnail } from "../helpers/requests/services/thumbnails";
import { getCorrectBundledItems } from "./bundledItems";
import { tryOpenCloudAuthRequest } from "./cloudAuth";
import { assetTypes } from "./itemTypes";
import { sleep } from "./misc";
import { chunk, crossSort } from "./objects";

export const CONTENT_ID_REGEX = /id((=)|(:\/\/))(\d+)/;
export const GLOBAL_CONTENT_ID_REGEX = /id((=)|(:\/\/))(\d+)/g;

export function getAssetDependencies(assetId: number, versionNumber?: number) {
	return getOrSetCache({
		key: ["assets", assetId, "versions", versionNumber, "dependencies"],
		fn: () =>
			assetDeliveryProcessor
				.request({
					assetId,
					version: versionNumber,
				})
				.then((requestData) => {
					if (!requestData || requestData?.errors?.[0]) {
						throw requestData?.errors?.[0]?.code || "UnknownError";
					}

					return httpClient
						.httpRequest<string>({
							url: requestData.locations[0].location,
							expect: "text",
							bypassCORS: import.meta.env.TARGET_BASE === "firefox",
						})
						.then(({ body }) => {
							const ids: number[] = [];
							const contentIds = body.matchAll(GLOBAL_CONTENT_ID_REGEX);

							for (const match of contentIds) {
								const id = Number.parseInt(match[4], 10);
								if (!ids.includes(id)) {
									ids.push(id);
								}
							}

							return ids;
						});
				}),
	});
}

export function getMostFrequentCreator(assetId: number, versionNumber?: number) {
	return getAssetDependencies(assetId, versionNumber).then(async (ids) => {
		if (!ids) {
			return;
		}

		const creators = (
			await Promise.all(
				ids.map((id) =>
					getAssetById({
						assetId: id,
					})
						.then((item) => item?.creator)
						.catch(() => {}),
				),
			)
		).filter((item): item is GeneralAssetCreator => {
			return !!item;
		});

		return crossSort(creators, (a, b) => {
			let aCount = 0;
			let bCount = 0;

			for (const creator of creators) {
				if (creator.id === a.id) {
					aCount++;
				}

				if (creator.id === b.id) {
					bCount++;
				}
			}

			return aCount - bCount;
		}).pop();
	});
}

export async function tryRender3dAssetThumbnail(assetId: number) {
	while (true) {
		const data = await get3dThumbnail({
			assetId,
		});

		if (UNRETRYABLE_STATES.includes(data.state)) {
			return data;
		}

		await sleep(1_500);
	}
}

export async function tryRender3dUserThumbnail(userId: number) {
	while (true) {
		const data = await getUser3dThumbnail({
			userId,
		});

		if (UNRETRYABLE_STATES.includes(data.state)) {
			return data;
		}

		await sleep(500);
	}
}

function listAllUserInventoryAssets(userId: number, assetTypes: string[]) {
	const assetTypesChunks = chunk(assetTypes, 20);

	const promises: Promise<ListedUserInventoryAsset[]>[] = [];
	for (const chunk of assetTypesChunks) {
		promises.push(
			(async () => {
				let cursor: string | null | undefined;
				const items: ListedUserInventoryAsset[] = [];
				while (cursor !== null) {
					try {
						const res = await listUserInventoryAssets({
							userId,
							assetTypes: chunk,
							limit: 50,
							filterDisapprovedAssets: true,
							cursor,
						});

						items.push(...res.data);

						cursor = res.nextPageCursor;
					} catch {
						return items.filter(
							(item, index, arr) =>
								arr.findIndex((item2) => item2.assetId === item.assetId) === index,
						);
					}
				}

				return items.filter(
					(item, index, arr) =>
						arr.findIndex((item2) => item2.assetId === item.assetId) === index,
				);
			})(),
		);
	}

	return Promise.all(promises).then((items) =>
		items
			.flat()
			.filter(
				(item, index, arr) =>
					arr.findIndex((item2) => item2.assetId === item.assetId) === index,
			),
	);
}

export function listAllUserWearableInventoryAssets(userId: number) {
	const filteredAssetTypes: string[] = [];
	for (const assetType of assetTypes) {
		if (assetType.isWearable) {
			filteredAssetTypes.push(assetType.assetType);
		}
	}

	return getOrSetCache({
		key: ["users", userId, "wearableInventory"],
		fn: () => listAllUserInventoryAssets(userId, filteredAssetTypes),
	});
}

export function listAllUserAnimatedAssets(userId: number) {
	const types: string[] = [];
	for (const type of assetTypes) {
		if (type.isAnimated) {
			types.push(type.assetType);
		}
	}
	return getOrSetCache({
		key: ["users", userId, "emotes"],
		fn: () => listAllUserInventoryAssets(userId, types),
	});
}

export async function listAllUserCollectibleItems(userId: number) {
	const promises: Promise<void>[] = [];
	const ids = new Set<number>();
	const items: ListedUserCollectibleAsset[] = [];

	for (const sortOrder of ["Asc", "Desc"]) {
		promises.push(
			(async () => {
				let cursor: string | undefined;
				let run = true;

				while (run) {
					try {
						const data = await listUserCollectibleAssets({
							userId,
							limit: 100,
							cursor,
							sortOrder: sortOrder as SortOrder,
						});

						for (const item of data.data) {
							if (ids.has(item.userAssetId)) {
								run = false;
							} else {
								items.push(item);
								ids.add(item.userAssetId);
							}
						}

						if (!data.nextPageCursor) break;
						cursor = data.nextPageCursor;

						await sleep(1_000);
					} catch (err) {
						if (err instanceof RESTError) {
							if (err.httpCode === 429) {
								await sleep(1_000);
							} else {
								// fail
								break;
							}
						}
					}
				}
			})(),
		);
	}

	await Promise.all(promises);

	return items;
}

export function listAllUserInventoryItemInstances(
	authedUserId: number,
	userId: number,
	isUnder13: boolean,
	itemType: MarketplaceItemType,
	itemId: number,
) {
	return getOrSetCache({
		key: ["users", userId, "items", itemType, itemId, "instances"],
		fn: async () => {
			let assetId: number | undefined;
			if (itemType === "Bundle") {
				const bundle = await getAvatarItem({
					itemId,
					itemType,
				});

				if (!bundle) return;

				assetId = (
					await getCorrectBundledItems(
						bundle.name,
						bundle.creatorType,
						bundle.creatorTargetId,
						bundle.bundledItems,
					)
				).find((item) => item.type === "Asset")?.id;
			} else assetId = itemId;

			if (!assetId) return;

			const allInstances: OpenCloudInventoryItem[] = [];
			let pageToken: string | undefined;
			while (true) {
				try {
					const response = await tryOpenCloudAuthRequest(
						authedUserId,
						isUnder13 === false,
						(credentials) =>
							listOpenCloudUserInventoryItems({
								credentials,
								userId,
								filter: `assetIds=${assetId}`,
								maxPageSize: 100,
								pageToken,
							}),
					);

					if (!response) break;
					for (const item of response.inventoryItems) {
						allInstances.push(item);
					}

					if (!response.nextPageToken) break;
					pageToken = response.nextPageToken;
				} catch {
					return [];
				}
			}

			return allInstances;
		},
	});
}

export function calculateRecentAveragePriceAfterSale(
	currentAveragePrice: number,
	priceToSellFor: number,
): number {
	if (currentAveragePrice === priceToSellFor) {
		return currentAveragePrice;
	}

	if (currentAveragePrice <= 0) {
		return priceToSellFor;
	}

	return (currentAveragePrice > priceToSellFor ? Math.floor : Math.ceil)(
		currentAveragePrice * 0.9 + priceToSellFor * 0.1,
	);
}
