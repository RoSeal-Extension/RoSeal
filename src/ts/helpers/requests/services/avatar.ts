import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { httpClient } from "../main";
import { getOrSetCache } from "../../cache";

export type GetUserCurrentlyWearingRequest = {
	userId: number;
};

export type GetUserCurrentlyWearingResponse = {
	assetIds: number[];
};

export type AssetMetaCoords = {
	X: number;
	Y: number;
	Z: number;
};
export type AvatarAssetMeta = {
	order?: number;
	puffiness?: number;
	position?: AssetMetaCoords;
	rotation?: AssetMetaCoords;
	scale?: AssetMetaCoords;
	version?: number;
};

export type AvatarAssetDefinition = {
	id: number;
	meta?: AvatarAssetMeta;
};

export type AvatarAssetDefinitionWithTypes = AvatarAssetDefinition & {
	assetType: {
		id: number;
		name?: string;
	};
	currentVersionId?: number;
};

export type AvatarBodyColorsRender = {
	headColor: string;
	torsoColor: string;
	rightArmColor: string;
	leftArmColor: string;
	rightLegColor: string;
	leftLegColor: string;
};

export type AvatarBodyColorsLegacy = {
	headColorId: number;
	torsoColorId: number;
	rightArmColorId: number;
	leftArmColorId: number;
	rightLegColorId: number;
	leftLegColorId: number;
};

export type AvatarScales = {
	height: number;
	width: number;
	head: number;
	depth: number;
	proportion: number;
	bodyType: number;
};

export type AvatarType = "R6" | "R15";

export type AvatarColors3s = {
	headColor3: string;
	torsoColor3: string;
	rightArmColor3: string;
	leftArmColor3: string;
	rightLegColor3: string;
	leftLegColor3: string;
};

export type AvatarEmote = {
	assetId: number;
	assetName: string;
	position: number;
};

export type AvatarEmotePosition = {
	assetId: number;
	position: number;
};

export type UserAvatar = {
	scales: AvatarScales;
	playerAvatarType: AvatarType;
	bodyColor3s: AvatarColors3s;
	assets: AvatarAssetDefinitionWithTypes[];
	defaultShirtApplied: boolean;
	defaultPantsApplied: boolean;
	emotes: AvatarEmote[];
};

export type LegacyUserAvatar = MappedOmit<UserAvatar, "bodyColor3s"> & {
	bodyColors: AvatarBodyColorsLegacy;
};

export type Scalable = {
	min: number;
	max: number;
	increment: number;
};

export type AccessoryRefinementBoundsPosition = {
	xPosition: number;
	yPosition: number;
	zPosition: number;
};

export type AccessoryRefinementBoundsRotation = {
	xRotation: number;
	yRotation: number;
	zRotation: number;
};

export type AccessoryRefinementBoundsScale = {
	xScale: number;
	yScale: number;
	zScale: number;
};

export type AccessoryRefinementBounds = {
	position: AccessoryRefinementBoundsPosition;
	rotation: AccessoryRefinementBoundsRotation;
	scale: AccessoryRefinementBoundsScale;
};

export type ScalesScalable = {
	height: Scalable;
	width: Scalable;
	head: Scalable;
	depth: Scalable;
	proportion: Scalable;
	bodyType: Scalable;
};

export type WearableAssetType = {
	maxNumber: number;
	id: number;
	name: string;
};

export type ColorPalette = {
	brickColorId: number;
	hexColor: string;
	name: string;
};

export type DefaultClothingAssets = {
	defaultShirtAssetIds: number[];
	defaultPantAssetIds: number[];
};

export type AvatarRestrictions = {
	playerAvatarTypes: AvatarType[];
	scales: ScalesScalable;
	wearableAssetTypes: WearableAssetType[];
	bodyColorsPalette: ColorPalette[];
	basicBodyColorsPalette: ColorPalette[];
	minimumDeltaEBodyColorDifference: number;
	proportionsAndBodyTypeEnabledForUser: boolean;
	defaultClothingAssetLists: DefaultClothingAssets;
	bundlesEnabledForUser: boolean;
	emotesEnabledForUser: boolean;
	accessoryRefinementTypes?: number[];
	accessoryRefinementLowerBounds?: Record<string, AccessoryRefinementBounds>;
	accessoryRefinementUpperBounds?: Record<string, AccessoryRefinementBounds>;
};

export type OutfitType = "Avatar" | "DynamicHead" | "Shoes";

export type OutfitInventoryType = "Avatar" | "Animations" | "DynamicHead" | "Body" | "Shoes";

export type OutfitRequest = {
	id: number;
	name: string;
	bodyColor3s: AvatarColors3s;
	assets: AvatarAssetDefinitionWithTypes[];
	scale: AvatarScales;
	playerAvatarType: AvatarType;
	outfitType: OutfitType;
	isEditable: boolean;
	universeId: number;
	moderationStatus: string;
	bundleId?: number;
	inventoryType: OutfitInventoryType;
};

export type PartialOutfitRequest = Partial<
	MappedOmit<
		OutfitRequest,
		"id" | "outfitType" | "isEditable" | "universeId" | "moderationStatus" | "inventoryType"
	>
>;

export type UpdateOutfitRequest = PartialOutfitRequest & {
	outfitId: number;
};

export type GetOutfitByIdRequest = {
	outfitId: number;
};

export type SetWearingAssetsRequest = {
	assets: AvatarAssetDefinition[];
};

export type SetAvatarTypeRequest = {
	playerAvatarType: string;
};

export type SetWearingAssetsResponse = {
	invalidAssets: AvatarAssetDefinition[];
	invalidAssetIds: number[];
	success: boolean;
};

export type ThumbnailCustomizationCamera = {
	fieldOfViewDeg: number;
	yRotDeg: number;
	distanceScale: number;
};

export type ThumbnailCustomization = {
	thumbnailType: number;
	emoteAssetId: number;
	camera: ThumbnailCustomizationCamera;
};

export type GetAvatarThumbnailCustomizationsResponse = {
	avatarThumbnailCustomizations: ThumbnailCustomization[];
};

export type ListedUserAvatarOutfit = {
	id: number;
	name: string;
	isEditable: boolean;
	outfitType: string;
};

export type ListUserAvatarOutfitsRequest = {
	userId: number;
	paginationToken?: string;
	outfitType?: string;
	page?: number;
	itemsPerPage?: number;
	isEditable?: boolean;
};

export type ListUserAvatarOutfitsResponse = {
	data: ListedUserAvatarOutfit[];
	paginationToken?: string;
};

export type GetUserAvatarRequest = {
	userId: number;
	checkAssetAvailability?: boolean;
};

export type ListUserAvatarItemsSortOption = "recentAdded" | "recentEquipped";

export type ListUserAvatarItemsRequest = {
	sortOption: ListUserAvatarItemsSortOption;
	pageLimit: number;
	pageToken?: string;
};

export type ListedUserAvatarItemCategory = {
	itemType: number;
	itemSubType: number;
};

export type ListedUserAvatarItem = {
	itemId: number;
	itemName: string;
	itemCategory?: ListedUserAvatarItemCategory;
	lastEquipTime?: string | null;
	acquisitionTime?: string;
};

export type ListUserAvatarItemsResponse = {
	avatarInventoryItems: ListedUserAvatarItem[];
	nextPageToken: string | null;
};

export type GetUserCurrentlyWearingOutfitsResponse = {
	outfitDetails: ListedUserAvatarOutfit[];
};

export type GetAvatarMetadataResponse = {
	enableDefaultClothingMessage: boolean;
	isAvatarScaleEmbeddedInTab: boolean;
	isBodyTypeScaleOutOfTab: boolean;
	scaleHeightIncrement: number;
	scaleWidthIncrement: number;
	scaleHeadIncrement: number;
	scaleProportionIncrement: number;
	scaleBodyTypeIncrement: number;
	supportProportionAndBodyType: boolean;
	showDefaultClothingMessageOnPageLoad: boolean;
	areThreeDeeThumbsEnabled: boolean;
	isAvatarWearingApiCallsLockingOnFrontendEnabled: boolean;
	isOutfitHandlingOnFrontendEnabled: boolean;
	isJustinUiChangesEnabled: boolean;
	isCategoryReorgEnabled: boolean;
	lCEnabledInEditorAndCatalog: boolean;
	isLCCompletelyEnabled: boolean;
};

export type FetchUserPlaceAvatarRequest = {
	userId: number;
	placeId?: number;
};

export type ResolvedUserPlaceAvatarAsset = {
	assetId: number;
	assetTypeId: number;
};

export type AvatarAnimationType =
	| "climb"
	| "walk"
	| "run"
	| "swim"
	| "idle"
	| "fall"
	| "death"
	| "mood"
	| "jump";

export type ResolvedUserPlaceAvatar = {
	resolvedAvatarType: AvatarType;
	equippedGearVersionIds: number[];
	backpackGearVersionIds: number[];
	assetAndAssetTypeIds: ResolvedUserPlaceAvatarAsset[];
	animationAssetIds: Record<AvatarAnimationType, number | null>;
	bodyColor3s: AvatarColors3s;
	scales: AvatarScales;
	emotes: AvatarEmote[];
};

export async function getAvatarRules(): Promise<AvatarRestrictions> {
	return getOrSetCache({
		key: ["avatar", "rules"],
		fn: () =>
			httpClient
				.httpRequest<AvatarRestrictions>({
					url: getRobloxUrl("avatar", "/v1/avatar-rules"),
					includeCredentials: true,
				})
				.then((res) => res.body),
	});
}

export async function getAuthenticatedUserAvatar() {
	return (
		await httpClient.httpRequest<UserAvatar>({
			url: getRobloxUrl("avatar", "/v2/avatar/avatar"),
			includeCredentials: true,
		})
	).body;
}

export async function getUserAvatar({ userId, ...request }: GetUserAvatarRequest) {
	return (
		await httpClient.httpRequest<UserAvatar>({
			url: `${getRobloxUrl("avatar")}/v2/avatar/users/${userId}/avatar`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function getLegacyAuthenticatedUserAvatar() {
	return (
		await httpClient.httpRequest<LegacyUserAvatar>({
			url: getRobloxUrl("avatar", "/v1/avatar"),
			includeCredentials: true,
		})
	).body;
}

export async function getUserCurrentlyWearing({ userId }: GetUserCurrentlyWearingRequest) {
	return (
		await httpClient.httpRequest<GetUserCurrentlyWearingResponse>({
			url: `${getRobloxUrl("avatar")}/v1/users/${userId}/currently-wearing`,
			includeCredentials: true,
		})
	).body;
}

export async function setBodyColors(request: AvatarColors3s) {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("avatar", "/v2/avatar/set-body-colors"),
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function updateOutfit({ outfitId, ...request }: UpdateOutfitRequest) {
	await httpClient.httpRequest({
		method: "PATCH",
		url: `${getRobloxUrl("avatar")}/v3/outfits/${outfitId}`,
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function createOutfit(request: PartialOutfitRequest) {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("avatar", "/v3/outfits/create"),
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function getOutfitById({ outfitId }: GetOutfitByIdRequest) {
	return (
		await httpClient.httpRequest<OutfitRequest>({
			url: `${getRobloxUrl("avatar")}/v3/outfits/${outfitId}/details`,
			includeCredentials: true,
		})
	).body;
}

export async function deleteOutfit({ outfitId }: GetOutfitByIdRequest) {
	await httpClient.httpRequest({
		method: "DELETE",
		url: `${getRobloxUrl("avatar")}/v3/outfits/${outfitId}`,
		expect: "none",
		includeCredentials: true,
	});
}

export async function setWearingAssets({ assets }: SetWearingAssetsRequest) {
	return (
		await httpClient.httpRequest<SetWearingAssetsResponse>({
			method: "POST",
			url: getRobloxUrl("avatar", "/v2/avatar/set-wearing-assets"),
			body: {
				type: "json",
				value: {
					assets,
				},
			},
			includeCredentials: true,
		})
	).body;
}

export async function setAvatarType({ playerAvatarType }: SetAvatarTypeRequest) {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("avatar", "/v1/avatar/set-player-avatar-type"),
		body: {
			type: "json",
			value: {
				playerAvatarType,
			},
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function setScales(request: AvatarScales) {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("avatar", "/v1/avatar/set-scales"),
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function setThumbnailCustomization(request: ThumbnailCustomization) {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("avatar", "/v1/avatar/thumbnail-customization"),
		body: {
			type: "json",
			value: request,
		},
		retries: import.meta.env.ENV === "background" ? 0 : undefined,
		expect: "none",
		includeCredentials: true,
	});
}

export async function getAvatarThumbnailCustomizations() {
	return (
		await httpClient.httpRequest<GetAvatarThumbnailCustomizationsResponse>({
			url: getRobloxUrl("avatar", "/v1/avatar/thumbnail-customizations"),
			includeCredentials: true,
		})
	).body;
}

export async function listUserAvatarOutfits({ userId, ...request }: ListUserAvatarOutfitsRequest) {
	return (
		await httpClient.httpRequest<ListUserAvatarOutfitsResponse>({
			url: `${getRobloxUrl("avatar")}/v2/avatar/users/${userId}/outfits`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function listUserAvatarItems(request: ListUserAvatarItemsRequest) {
	return (
		await httpClient.httpRequest<ListUserAvatarItemsResponse>({
			url: getRobloxUrl("avatar", "/v1/avatar-inventory"),
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function getUserCurrentlyWearingOutfits({ userId }: GetUserCurrentlyWearingRequest) {
	return (
		await httpClient.httpRequest<GetUserCurrentlyWearingOutfitsResponse>({
			url: `${getRobloxUrl("avatar")}/v1/users/${userId}/currently-wearing-outfits`,
			includeCredentials: true,
		})
	).body;
}

export async function redrawUserThumbnail() {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("avatar", "/v1/avatar/redraw-thumbnail"),
		expect: "none",
		includeCredentials: true,
	});
}

export async function getAvatarMetadata() {
	return (
		await httpClient.httpRequest<GetAvatarMetadataResponse>({
			url: getRobloxUrl("avatar", "/v1/avatar/metadata"),
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

export async function fetchUserPlaceAvatar(request: FetchUserPlaceAvatarRequest) {
	return (
		await httpClient.httpRequest<ResolvedUserPlaceAvatar>({
			url: getRobloxUrl("avatar", "/v2/avatar/avatar-fetch"),
			search: request,
			includeCredentials: true,
		})
	).body;
}
