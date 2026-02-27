import type { AvatarAssetDefinitionWithTypes } from "src/ts/helpers/requests/services/avatar";

export type BundleTypeData = {
	bundleTypeId: number;
	bundleType: string;
	alternativeTypes?: string[];
	isAnimated?: boolean;
	searchQuery?: Record<string, string | number | undefined>;
};

export type AssetTypeGroup = {
	lockedLimit: number;
};

export const assetTypeGroups = {
	Bottoms: {
		lockedLimit: 1,
	},
	Tops: {
		lockedLimit: 1,
	},
	Outerwear: {
		lockedLimit: 1,
	},
	Heads: {
		lockedLimit: 1,
	},

	Makeup: {
		lockedLimit: 8,
	},
} satisfies Record<string, AssetTypeGroup>;

export type AssetTypeData = {
	assetTypeId: number;
	assetType: string;
	alternativeTypes?: string[];

	isPartOfHead?: boolean;
	isBodyPart?: boolean;
	canHaveThumbnail?: boolean;
	isAvatarAsset?: boolean;
	isWearable?: boolean;
	assetTypeGroup?: keyof typeof assetTypeGroups;
	isDeletable?: boolean;
	isLayered?: boolean;
	isLayeredMixable?: boolean;
	isUsuallyTemplate?: boolean;
	lockedLimit?: number;
	is3D?: boolean;
	isAnimated?: boolean;
	isAccessory?: boolean;
	searchQuery?: Record<string, string | number | undefined>;
	isCreatorMarketplaceAsset?: boolean;
	meta?: {
		order: number;
	};
};

export const assetTypes = [
	{
		assetType: "Image",
		assetTypeId: 1,
	},
	{
		assetType: "TShirt",
		assetTypeId: 2,
		isAvatarAsset: true,
		isWearable: true,
		isDeletable: true,
	},
	{
		assetType: "Audio",
		assetTypeId: 3,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "Mesh",
		assetTypeId: 4,
	},
	{
		assetType: "Lua",
		assetTypeId: 5,
	},
	{
		assetType: "HTML",
		assetTypeId: 6,
	},
	{
		assetType: "Text",
		assetTypeId: 7,
	},
	{
		assetType: "Hat",
		assetTypeId: 8,
		isAccessory: true,
		lockedLimit: 3,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "Place",
		assetTypeId: 9,
	},
	{
		assetType: "Model",
		assetTypeId: 10,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "Shirt",
		assetTypeId: 11,
		isDeletable: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "Pants",
		assetTypeId: 12,
		isDeletable: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "Decal",
		assetTypeId: 13,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "Avatar",
		assetTypeId: 16,
	},
	{
		assetType: "Head",
		assetTypeId: 17,
		assetTypeGroup: "Heads",
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isPartOfHead: true,
	},
	{
		assetType: "Face",
		assetTypeId: 18,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "Gear",
		assetTypeId: 19,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "Badge",
		assetTypeId: 21,
	},
	{
		assetType: "GroupEmblem",
		assetTypeId: 22,
	},
	{
		assetType: "Animation",
		isDeletable: true,
		assetTypeId: 24,
	},
	{
		assetType: "Arms",
		assetTypeId: 25,
	},
	{
		assetType: "Legs",
		assetTypeId: 26,
	},
	{
		assetType: "Torso",
		assetTypeId: 27,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isBodyPart: true,
	},
	{
		assetType: "RightArm",
		alternativeTypes: ["Right Arm"],
		assetTypeId: 28,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isBodyPart: true,
	},
	{
		assetType: "LeftArm",
		alternativeTypes: ["Left Arm"],
		assetTypeId: 29,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isBodyPart: true,
	},
	{
		assetType: "LeftLeg",
		alternativeTypes: ["Left Leg"],
		assetTypeId: 30,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isBodyPart: true,
	},
	{
		assetType: "RightLeg",
		alternativeTypes: ["Right Leg"],
		assetTypeId: 31,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isBodyPart: true,
	},
	{
		assetType: "Package",
		assetTypeId: 32,
	},
	{
		assetType: "YouTubeVideo",
		assetTypeId: 33,
	},
	{
		assetType: "GamePass",
		assetTypeId: 34,
	},
	{
		assetType: "App",
		assetTypeId: 35,
	},
	{
		assetType: "Code",
		assetTypeId: 37,
	},
	{
		assetType: "Plugin",
		assetTypeId: 38,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "SolidModel",
		assetTypeId: 39,
	},
	{
		assetType: "MeshPart",
		assetTypeId: 40,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "HairAccessory",
		alternativeTypes: ["Hair Accessory"],
		assetTypeId: 41,
		searchQuery: {
			Category: 4,
			Subcategory: 20,
		},
		isAccessory: true,
		is3D: true,
		meta: {
			order: 11,
		},
		isAvatarAsset: true,
		isWearable: true,
		isLayeredMixable: true,
	},
	{
		assetType: "FaceAccessory",
		assetTypeId: 42,
		isAccessory: true,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "NeckAccessory",
		assetTypeId: 43,
		isAccessory: true,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "ShoulderAccessory",
		assetTypeId: 44,
		isAccessory: true,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "FrontAccessory",
		assetTypeId: 45,
		isAccessory: true,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "BackAccessory",
		assetTypeId: 46,
		isAccessory: true,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "WaistAccessory",
		assetTypeId: 47,
		isAccessory: true,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "ClimbAnimation",
		assetTypeId: 48,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "DeathAnimation",
		assetTypeId: 49,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "FallAnimation",
		assetTypeId: 50,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "IdleAnimation",
		assetTypeId: 51,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "JumpAnimation",
		assetTypeId: 52,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "RunAnimation",
		assetTypeId: 53,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "SwimAnimation",
		assetTypeId: 54,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "WalkAnimation",
		assetTypeId: 55,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "PoseAnimation",
		assetTypeId: 56,
		isAnimated: true,
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "LocalizationTableManifest",
		assetTypeId: 59,
	},
	{
		assetType: "LocalizationTableTranslation",
		assetTypeId: 60,
	},
	{
		assetType: "EmoteAnimation",
		assetTypeId: 61,
		isAnimated: true,
		isAvatarAsset: true,
	},
	{
		assetType: "Video",
		assetTypeId: 62,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "TexturePack",
		assetTypeId: 63,
	},
	{
		assetType: "TShirtAccessory",
		assetTypeId: 64,
		assetTypeGroup: "Tops",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 7,
		},
		alternativeTypes: ["TshirtAccessory"],
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "ShirtAccessory",
		assetTypeId: 65,
		assetTypeGroup: "Tops",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 8,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "PantsAccessory",
		assetTypeId: 66,
		assetTypeGroup: "Bottoms",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 4,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "JacketAccessory",
		assetTypeId: 67,
		assetTypeGroup: "Outerwear",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 10,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "SweaterAccessory",
		assetTypeId: 68,
		assetTypeGroup: "Tops",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 9,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "ShortsAccessory",
		assetTypeId: 69,
		assetTypeGroup: "Bottoms",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 5,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "LeftShoeAccessory",
		assetTypeId: 70,
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 3,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "RightShoeAccessory",
		assetTypeId: 71,
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 3,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "DressSkirtAccessory",
		assetTypeId: 72,
		assetTypeGroup: "Bottoms",
		isAccessory: true,
		isLayered: true,
		is3D: true,
		meta: {
			order: 6,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "FontFamily",
		assetTypeId: 73,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "FontFace",
		assetTypeId: 74,
		isDeletable: true,
		isCreatorMarketplaceAsset: true,
	},
	{
		assetType: "MeshHiddenSurfaceRemoval",
		assetTypeId: 75,
		canHaveThumbnail: false,
	},
	{
		assetType: "EyebrowAccessory",
		alternativeTypes: ["Eyebrow Accessory"],
		assetTypeId: 76,
		lockedLimit: 1,
		isLayered: true,
		isPartOfHead: true,
		is3D: true,
		meta: {
			order: 1,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "EyelashAccessory",
		alternativeTypes: ["Eyelash Accessory"],
		assetTypeId: 77,
		isLayered: true,
		isPartOfHead: true,
		lockedLimit: 1,
		is3D: true,
		meta: {
			order: 2,
		},
		isAvatarAsset: true,
		isWearable: true,
	},
	{
		assetType: "MoodAnimation",
		alternativeTypes: ["Mood Animation"],
		assetTypeId: 78,
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isUsuallyTemplate: true,
		isPartOfHead: true,
	},
	{
		assetType: "DynamicHead",
		alternativeTypes: ["Dynamic Head"],
		assetTypeId: 79,
		assetTypeGroup: "Heads",
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isPartOfHead: true,
	},
	{
		assetType: "CodeSnippet",
		assetTypeId: 80,
	},
	{
		assetType: "AdsVideo",
		assetTypeId: 81,
	},
	{
		assetType: "OtaUpdate",
		assetTypeId: 82,
	},
	{
		assetType: "Screenshot",
		assetTypeId: 83,
	},
	{
		assetType: "RuntimePropertySet",
		assetTypeId: 84,
	},
	{
		assetType: "StorePreviewVideo",
		assetTypeId: 85,
	},
	{
		assetType: "GamePreviewVideo",
		assetTypeId: 86,
	},
	{
		assetType: "CreatorExperienceConfig",
		assetTypeId: 87,
	},
	{
		assetType: "FaceMakeup",
		assetTypeId: 88,
		assetTypeGroup: "Makeup",
		is3D: true,
		isAvatarAsset: true,
		isWearable: true,
		isPartOfHead: true,
	},
	{
		assetType: "LipMakeup",
		assetTypeId: 89,
		assetTypeGroup: "Makeup",
		isAvatarAsset: true,
		is3D: true,
		isWearable: true,
		isPartOfHead: true,
	},
	{
		assetType: "EyeMakeup",
		assetTypeId: 90,
		assetTypeGroup: "Makeup",
		isAvatarAsset: true,
		is3D: true,
		isWearable: true,
		isPartOfHead: true,
	},
] satisfies AssetTypeData[];

export const bundleTypes = [
	{
		bundleTypeId: 1,
		bundleType: "BodyParts",
		alternativeTypes: ["Body"],
		searchQuery: {
			Category: 17,
			Subcategory: undefined,
		},
	},
	{
		bundleTypeId: 2,
		bundleType: "AvatarAnimations",
		searchQuery: {
			Category: 12,
			Subcategory: 38,
		},
		isAnimated: true,
	},
	{
		bundleTypeId: 3,
		bundleType: "Shoes",
		searchQuery: {
			Category: 3,
			Subcategory: 64,
		},
	},
	{
		bundleTypeId: 4,
		bundleType: "DynamicHead",
		searchQuery: {
			Category: 4,
			Subcategory: 66,
		},
	},
] satisfies BundleTypeData[];

export const placeAssetTypeId = 9;
export const emoteAssetTypeName = "EmoteAnimation";
export const passAssetTypeId = 34;
export const badgeAssetTypeId = 21;

export function getAssetTypeData(identifier: number | string): AssetTypeData | undefined {
	let assetTypeData: AssetTypeData | undefined;

	for (const assetType of assetTypes) {
		if (
			typeof identifier === "number"
				? assetType.assetTypeId === identifier
				: assetType.assetType === identifier ||
					assetType.alternativeTypes?.includes(identifier)
		) {
			assetTypeData = assetType;
			break;
		}
	}

	return assetTypeData;
}

export function getBundleTypeData(identifier: number | string): BundleTypeData | undefined {
	return (bundleTypes as BundleTypeData[]).find((bundleTypeData) =>
		typeof identifier === "number"
			? bundleTypeData.bundleTypeId === identifier
			: bundleTypeData.bundleType === identifier ||
				bundleTypeData.alternativeTypes?.includes(identifier),
	);
}

export function getEqualAssetsCount(
	asset: AvatarAssetDefinitionWithTypes,
	assets: AvatarAssetDefinitionWithTypes[],
) {
	return assets.filter((asset2) => isAssetsEqual(asset, asset2)).length;
}

export function isAssetsEqual(
	asset1: AvatarAssetDefinitionWithTypes,
	asset2: AvatarAssetDefinitionWithTypes,
) {
	return asset1.id === asset2.id;
}

export type WornAssetLimit = {
	type: string;
	assetTypeId?: number;
	max: number;
	remaining: number;
	used: number;
};

export type FilterWornAssetsData<T extends AvatarAssetDefinitionWithTypes> = {
	limits: WornAssetLimit[];
	assets: T[];
};

export function filterWornAssets<T extends AvatarAssetDefinitionWithTypes>(
	assets: T[],
	useUnlockedLimits?: boolean,
	robloxFilteredAssets?: T[],
): FilterWornAssetsData<T> {
	const limits = {
		remainingLayeredClothing: useUnlockedLimits ? 10 : 5,
		// ignored when useUnlockedLimits is false
		remainingAccessories: 10,
		otherTypes: new Map<number, number>(),
		categories: new Map<string, number>(),
	};

	const newAssets = new Set<T>();
	for (const asset of assets) {
		const type = getAssetTypeData(asset.assetType.id);
		let shouldAdd = true;
		const useOnlyLayeredLimit =
			type?.isLayered && type.isAccessory && (useUnlockedLimits || !robloxFilteredAssets);

		if (useOnlyLayeredLimit || type?.isLayeredMixable) {
			if (limits.remainingLayeredClothing === 0) {
				shouldAdd = false;
			} else {
				limits.remainingLayeredClothing--;
			}
		}

		if (!useOnlyLayeredLimit) {
			if (useUnlockedLimits && type?.isAccessory && !type.isLayered) {
				if (limits.remainingAccessories === 0) {
					shouldAdd = false;
				} else {
					limits.remainingAccessories--;
				}
			} else if (robloxFilteredAssets && !type?.isAccessory) {
				if (!robloxFilteredAssets.includes(asset)) {
					shouldAdd = false;
				}
			} else {
				const typeGroup = type?.assetTypeGroup
					? assetTypeGroups[type.assetTypeGroup]
					: undefined;
				const typeAmount =
					(typeGroup
						? limits.categories.get(type!.assetTypeGroup!)
						: limits.otherTypes.get(asset.assetType.id)) ?? 0;
				if (typeAmount >= (typeGroup?.lockedLimit ?? type?.lockedLimit ?? 1)) {
					shouldAdd = false;
				} else {
					if (typeGroup) {
						limits.categories.set(type!.assetTypeGroup!, typeAmount + 1);
					} else {
						limits.otherTypes.set(asset.assetType.id, typeAmount + 1);
					}
				}
			}
		}

		if (shouldAdd) {
			newAssets.add(asset);
		}
	}

	const filteredAssets: T[] = [];
	for (const asset of newAssets) {
		if (!filteredAssets.some((asset2) => isAssetsEqual(asset, asset2))) {
			filteredAssets.push(asset);
		}
	}

	// Create limits array with usage information
	const limitsArray = [];

	// Add layered clothing limit info
	const totalLayeredClothing = useUnlockedLimits ? 10 : 5;
	limitsArray.push({
		type: "LayeredClothing",
		remaining: limits.remainingLayeredClothing,
		used: totalLayeredClothing - limits.remainingLayeredClothing,
		max: totalLayeredClothing,
	});

	// Add accessories limit info (only when using unlocked limits)
	if (useUnlockedLimits) {
		limitsArray.push({
			type: "Accessories",
			remaining: limits.remainingAccessories,
			used: 10 - limits.remainingAccessories,
			max: 10,
		});
	}

	// Track which categories we've already added
	const addedCategories = new Set<string>();

	// Add category limits (only when not using unlocked limits)
	if (!useUnlockedLimits) {
		for (const categoryName in assetTypeGroups) {
			const category = assetTypeGroups[categoryName as keyof typeof assetTypeGroups];

			const used = limits.categories.get(categoryName) ?? 0;

			limitsArray.push({
				type: categoryName,
				remaining: category.lockedLimit - used,
				used,
				max: category.lockedLimit,
			});

			addedCategories.add(categoryName);
		}
	}

	// Iterate through ALL asset types
	for (const assetTypeData of assetTypes) {
		// Skip asset types that aren't wearable
		if (!assetTypeData.isWearable) {
			continue;
		}

		// Skip asset types that would be counted under unlocked accessories
		if (useUnlockedLimits && assetTypeData.isAccessory && !assetTypeData.isLayered) {
			continue;
		}

		// Skip asset types that are in categories we've already added (when not using unlocked limits)
		if (
			!useUnlockedLimits &&
			assetTypeData.assetTypeGroup &&
			addedCategories.has(assetTypeData.assetTypeGroup)
		) {
			continue;
		}

		// Handle other individual asset types
		const used = limits.otherTypes.get(assetTypeData.assetTypeId) ?? 0;
		const limit = assetTypeData.lockedLimit ?? 1;

		limitsArray.push({
			type: assetTypeData.assetType,
			assetTypeId: assetTypeData.assetTypeId,
			remaining: Math.max(0, limit - used),
			used,
			max: limit,
		});
	}

	return { assets: filteredAssets, limits: limitsArray };
}
export function isAssetsDefaultOrder<T extends AvatarAssetDefinitionWithTypes>(assets: T[]) {
	return assets.every((asset) => {
		const assetType = getAssetTypeData(asset.assetType.id);

		return !asset.meta || asset.meta.order === assetType?.meta?.order;
	});
}

export function insertAssetMetaIntoAssetList<T extends AvatarAssetDefinitionWithTypes>(
	asset: NoInfer<T>,
	assets: T[],
	modifyOrder = true,
) {
	let newAsset: AvatarAssetDefinitionWithTypes | undefined;

	const filteredAssets: T[] = [];

	let hasModifiedOrder = false;
	for (const listAsset of assets) {
		if (isAssetsEqual(asset, listAsset)) {
			newAsset = listAsset;
		} else if (
			modifyOrder &&
			asset.meta?.order &&
			listAsset.meta?.order &&
			listAsset.meta.order >= asset.meta.order &&
			getAssetTypeData(listAsset.assetType.id)?.isLayered
		) {
			hasModifiedOrder = true;
			listAsset.meta.order++;
		}

		filteredAssets.push(listAsset);
	}

	if (asset.meta && newAsset) {
		newAsset.meta = structuredClone(asset.meta);

		if (getAssetTypeData(asset.assetType.id)?.isLayered) {
			const order =
				(hasModifiedOrder ? newAsset.meta?.order : asset.meta.order) ?? asset.meta.order;
			newAsset.meta.order = order;
		}
	}

	return filteredAssets;
}

export function buildMetaForAsset<T extends AvatarAssetDefinitionWithTypes>(
	asset: NoInfer<T>,
	assets: T[],
	replaceSameType = true,
) {
	const assetType = getAssetTypeData(asset.assetType.id);
	if (!assetType?.isLayered || !assetType.meta?.order) {
		return asset;
	}

	const defaultOrder = assetType.meta.order;
	let meta = structuredClone(asset.meta);
	if (isAssetsDefaultOrder(assets)) {
		meta ??= {};
		meta.order = assetType.meta.order;
	} else {
		let assetListPosition = 0;

		let defaultOrderDifference: number | undefined;
		let proposedOrder: number | undefined;

		for (const listAsset of assets) {
			const listAssetType = getAssetTypeData(listAsset.assetType.id);
			if (!listAssetType?.isLayered) {
				continue;
			}

			if (isAssetsEqual(asset, listAsset)) {
				meta ??= {};
				meta.order = listAsset.meta?.order;
			} else if (listAssetType?.assetTypeId === assetType.assetTypeId) {
				if (replaceSameType) {
					meta ??= {};
					meta.order = listAsset.meta?.order;
				} else {
					defaultOrderDifference = 0;
					proposedOrder = (listAsset.meta?.order ?? 1) + 1;
				}
			} else {
				const listAssetDefaultPosition = listAssetType.meta?.order ?? 1;
				if (
					listAssetDefaultPosition > defaultOrder &&
					(defaultOrderDifference === undefined ||
						listAssetDefaultPosition - defaultOrder < defaultOrderDifference) &&
					!(replaceSameType && assetType.assetTypeGroup === listAssetType.assetTypeGroup)
				) {
					defaultOrderDifference = listAssetDefaultPosition - defaultOrder;
					proposedOrder = (listAsset.meta?.order ?? 2) - 1;
				}
			}

			assetListPosition++;
		}

		if (meta === undefined) {
			meta = {
				order: assetListPosition ?? proposedOrder,
			};
		}
	}

	return {
		...asset,
		meta,
	};
}

export function buildMetaForAssets<T extends AvatarAssetDefinitionWithTypes>(
	assets: T[],
	preserveMeta = false,
	layeredClothingAssetList?: T[],
) {
	const filteredAssets: T[] = [];

	for (const asset of assets) {
		const newAsset = structuredClone(asset);
		const type = getAssetTypeData(asset.assetType.id);
		if (type?.isLayered) {
			const length =
				layeredClothingAssetList && getEqualAssetsCount(newAsset, layeredClothingAssetList);

			if (!(preserveMeta && newAsset.meta) && layeredClothingAssetList && length) {
				newAsset.meta = {
					order: length,
				};
			} else if (!newAsset.meta) {
				newAsset.meta = {
					order: getAssetTypeData(asset.assetType.id)?.meta?.order,
				};
			}
		}

		filteredAssets.push(newAsset);
	}

	return filteredAssets;
}

export function constructLayeredClothingMetadata(
	assets: AvatarAssetDefinitionWithTypes[],
	layeredClothingOrder: AvatarAssetDefinitionWithTypes[],
) {
	const wornAssets: AvatarAssetDefinitionWithTypes[] = [];

	for (const asset of assets) {
		const assetInfo = structuredClone(asset);

		const typeData = getAssetTypeData(asset.assetType.id);
		if (getAssetTypeData(asset.assetType.id)?.isLayered) {
			let order = typeData?.meta?.order;
			const lcIndex = layeredClothingOrder.findIndex((item) => item.id === asset.id);
			if (lcIndex >= 0) {
				order = lcIndex;
			}
			if (order !== undefined) {
				assetInfo.meta ??= {};
				assetInfo.meta.order = order;
				assetInfo.meta.version = 1;
			}
		}
		wornAssets.push(assetInfo);
	}

	return wornAssets;
}
