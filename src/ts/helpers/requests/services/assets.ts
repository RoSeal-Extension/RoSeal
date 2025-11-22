import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache, getOrSetCaches } from "../../cache.ts";
import {
	httpClient,
	ROBLOX_BROWSER_ASSET_REQUEST_HEADER_NAME,
	ROBLOX_PLACE_ID_HEADER_NAME,
} from "../main.ts";
import type { AvatarItemSaleLocationTypeId } from "./marketplace.ts";
import type { SortOrder } from "./badges.ts";

export type GetAssetByIdRequest = {
	assetId: number;
	overrideCache?: boolean;
};

export type Agent = "User" | "Group";
export type AgentTypeId = 1 | 2;

export type GeneralAssetCreator = {
	id: number;
	name: string | null;
	creatorType: Agent | null;
	creatorTargetId: number;
	hasVerifiedBadge: boolean;
};

export type AssetSaleLocation = {
	// 'Invalid' = 0, 'ShopOnly' = 1, 'MyExperiencesOnly' = 2, 'ShopAndMyExperiences' = 3, 'ExperiencesById' = 4, 'ShopAndAllExperiences' = 5, 'ExperiencesDevApiOnly' = 6, 'ShopAndExperiencesById' = 7]
	saleLocationType: AvatarItemSaleLocationTypeId;
	universeIds?: number[];
};

export type AssetSaleAvailabilityLocation = "Catalog" | "AllUniverses" | "MyUniverses";

export type AssetCollectibleItemDetails = {
	collectibleLowestResalePrice: number | null;
	collectibleLowestAvailableResaleProductId: string | null;
	collectibleLowestAvailableResaleItemInstanceId: string | null;
	collectibleQuantityLimitPerUser: number;
	totalQuantity: number;
	isLimited: boolean;
};

export type PriceInformation = {
	defaultPriceInRobux: number;
	isInActivePriceOptimizationExperiment?: boolean;
};

export type GeneralAssetDetails = {
	targetId: number;
	productType: string | null;
	assetId: number;
	productId: number | null;
	name: string;
	description: string | null;
	assetTypeId: number;
	creator: GeneralAssetCreator;
	iconImageAssetId: number | null;
	created: string;
	updated: string;
	priceInRobux: number | null;
	premiumPriceInRobux?: number | null;
	priceInTickets: number | null;
	isNew: boolean;
	isForSale: boolean;
	isPublicDomain: boolean;
	isLimited: boolean;
	isLimitedUnique: boolean;
	remaining: number | null;
	sales: number | null;
	minimumMembershipLevel: number;
	priceInformation?: PriceInformation | null;
	contentRatingTypeId: number;
	saleAvailabilityLocations: AssetSaleAvailabilityLocation[] | null;
	saleLocation: AssetSaleLocation | null;
	collectibleItemId: string | null;
	collectibleProductId: string | null;
	collectiblesItemDetails: AssetCollectibleItemDetails | null;
};

export type DevelopCreator = {
	type: Agent;
	typeId: AgentTypeId;
	targetId: number;
};

export type DevelopAsset = {
	id: number;
	type: string;
	typeId: number;
	name: string;
	description: string;
	creator: DevelopCreator;
	genres: string[];
	created: string;
	updated: string;
	enableComments: boolean;
	isPublicDomainEnabled: boolean;
	isModerated: boolean;
	reviewStatus: string;
	isVersioningEnabled: boolean;
	isArchivable: boolean;
	canHaveThumbnail: string;
};

export type MultigetDevelopAssetsByIdsResponse = {
	data: DevelopAsset[];
};

export type MultigetDevelopAssetsByIdsRequest = {
	assetIds: number[];
	overrideCache?: boolean;
};

export type RequestAssetContentsRequest = {
	assetId: number;
};

export type RequestAssetContentsByVersionRequest = RequestAssetContentsRequest & {
	versionNumber: number;
};

export type AssetLocationMetadata = {
	metadataType: number;
	value: string;
};

export type AssetContentLocation = {
	assetFormat: string;
	location: string;
	assetMetadatas?: AssetLocationMetadata[];
};

export type AssetContentError = {
	code: number;
	message: string;
	customErrorCode: number;
};

export type AssetContentRepresentationSpecifier = {
	format: string;
	majorVersion: string;
	fidelity: string;
};

export type RequestAssetContentsResponse = {
	locations: AssetContentLocation[];
	errors?: AssetContentError[];
	requestId: string;
	isHashDynamic: boolean;
	isCopyrightProtected: boolean;
	isArchived: boolean;
	assetTypeId: number;
	contentRepresentationSpecifier?: AssetContentRepresentationSpecifier;
	isRecordable: boolean;
};

export type CreationCreator =
	| {
			userId: number;
	  }
	| {
			groupId: number;
	  };

export type CreationContext = {
	creator: CreationCreator;
};

export type UploadAssetRequestDetail = {
	assetType: string | number;
	displayName: string;
	description: string;
	creationContext: CreationContext;
};

export type UploadAssetRequest = {
	request: UploadAssetRequestDetail;
	fileContent: Blob;
};

export type AssetModerationResult = {
	moderationState: string;
};

export type UploadedAssetData = UploadAssetRequestDetail & {
	path: string;
	revisionId: string;
	revisionCreateTime: string;
	assetId: string;
	moderationResult: AssetModerationResult;
};

export type UploadAssetResponse = {
	path: string;
	operationId: string;
	done: boolean;
	response: UploadedAssetData;
};

export type GetOperationDetailsRequest = {
	operationId: string;
};

export type CreatorAssetSocialLink = {
	title?: string;
	uri?: string;
};

export type CreatorAssetCreationContext = {
	creator?: {
		userId?: string;
		groupId?: string;
	} | null;
	expectedPrice?: number;
	creatingUniverseId?: string;
};

export type CreatorAssetModerationResult = {
	moderationState?: string;
};

export type CreatorAssetBloodGuidelines = {
	realism?: string;
	level?: string;
};

export type CreatorAssetContentGuideline = {
	presence?: string;
};

export type CreatorAssetRomanceGuideline = {
	type?: string;
};

export type CreatorAssetAgeGuidelines = {
	ageGuideline: string;
	blood?: CreatorAssetBloodGuidelines;
	violence?: { intensity?: string };
	profanity?: CreatorAssetContentGuideline;
	alcohol?: CreatorAssetContentGuideline;
	romance?: CreatorAssetRomanceGuideline;
};

export type CreatorAssetPreview = {
	asset: string;
	altText?: string;
};

export type CreatorAssetDetails = {
	path: string;
	revisionId: string;
	revisionCreateTime: Date | null;
	assetId: string | number;
	displayName: string;
	description?: string;
	assetType: string;
	creationContext: CreatorAssetCreationContext;
	moderationResult: CreatorAssetModerationResult;
	published?: boolean;
	icon?: string;
	ageGuidelines?: CreatorAssetAgeGuidelines;
	previews?: CreatorAssetPreview[] | null;
	state: string;
	facebookSocialLink?: CreatorAssetSocialLink;
	twitterSocialLink?: CreatorAssetSocialLink;
	youtubeSocialLink?: CreatorAssetSocialLink;
	twitchSocialLink?: CreatorAssetSocialLink;
	discordSocialLink?: CreatorAssetSocialLink;
	githubSocialLink?: CreatorAssetSocialLink;
	robloxSocialLink?: CreatorAssetSocialLink;
	guildedSocialLink?: CreatorAssetSocialLink;
	devForumSocialLink?: CreatorAssetSocialLink;
};

export type GeneralLessAssetDetails = MappedOmit<
	GeneralAssetDetails,
	| "priceInformation"
	| "contentRatingTypeId"
	| "saleAvailabilityLocations"
	| "saleLocation"
	| "collectibleItemId"
	| "collectibleProductId"
	| "collectiblesItemDetails"
	| "creator"
> & {
	creator: MappedOmit<GeneralAssetCreator, "hasVerifiedBadge">;
};

export type BatchGetAssetContentsRequestItem = {
	assetName?: string;
	assetType?: string;
	clientInsert?: boolean;
	placeId?: boolean;
	requestId: string;
	scriptInsert?: boolean;
	serverPlaceId?: number;
	universeId?: number;
	accept?: string;
	encoding?: string;
	hash?: string;
	assetId: number;
	version?: number;
	modulePlaceId?: number;
	assetFormat?: string;
	"roblox-assetFormat"?: string;
	contentRepresentationPriorityList?: string;
	doNotFallbackToBaselineRepresentation?: boolean;
};

export type BatchGetAssetsContentsRequest = {
	requests: BatchGetAssetContentsRequestItem[];
	robloxPlaceId?: number;
	inBrowserRequest?: boolean;
};

export type StoreAudioDetails = {
	audioType?: string;
	artist?: string;
	title?: string;
	musicAlbum?: string;
	musicGenre?: string;
	soundEffectCategory?: string;
	soundEffectSubcategory?: string;
	tags?: string[];
};

export type StoreDetailsAgeGuidelinesBlood = {
	realism?: string;
	level?: string;
};

export type StoreDetailsAgeGuidelinesViolence = {
	intensity?: string;
};

export type StoreDetailsAgeGuidelinesProfanity = {
	presence?: string;
};

export type StoreDetailsAgeGuidelinesAlcohol = {
	presence?: string;
};

export type StoreDetailsAgeGuidelinesRomance = {
	type?: string;
};

export type StoreDetailsAgeGuidelines = {
	ageGuideline?: string;
	blood?: StoreDetailsAgeGuidelinesBlood | null;
	violence?: StoreDetailsAgeGuidelinesViolence | null;
	profanity?: StoreDetailsAgeGuidelinesProfanity | null;
	alcohol?: StoreDetailsAgeGuidelinesAlcohol | null;
	romance?: StoreDetailsAgeGuidelinesRomance | null;
};

export type StoreSocialLink = {
	linkType: string;
	title: string;
	url: string;
};

export type StoreDetailsMeshSummary = {
	triangles: number;
	vertices: number;
};

export type StoreDetailsInstanceCounts = {
	script: number;
	meshPart: number;
	animation: number;
	decal: number;
	audio: number;
	tool: number;
};

export type StoreDetailsModelTechnicalDetails = {
	objectMeshSummary: StoreDetailsMeshSummary;
	instanceCounts: StoreDetailsInstanceCounts;
};

export type StoreDetailsPreviewAssets = {
	imagePreviewAssets: number[];
	videoPreviewAssets: number[];
};

export type StoreAssetDetailsAsset = {
	audioDetails?: StoreAudioDetails;
	id: number;
	name: string;
	typeId: number;
	assetSubTypes: string[] | null;
	assetGenres: string[];
	ageGuidelines?: StoreDetailsAgeGuidelines;
	isEndorsed: boolean;
	description: string | null;
	duration?: number;
	hasScripts?: boolean;
	createdUtc: Date | null;
	updatedUtc: Date | null;
	creatingUniverseId?: number | null;
	isAssetHashApproved?: boolean;
	visibilityStatus?: string | null;
	socialLinks?: StoreSocialLink[] | null;
	modelTechnicalDetails?: StoreDetailsModelTechnicalDetails | null;
	previewAssets?: StoreDetailsPreviewAssets;
};

export type StoreDetailsCreator = {
	id: number;
	name: string;
	type: number;
	isVerifiedCreator: boolean;
	latestGroupUpdaterUserId: number;
	latestGroupUpdaterUserName: string;
};

export type StoreDetailsVoting = {
	showVotes: boolean;
	upVotes: number;
	downVotes: number;
	canVote: boolean;
	userVote: boolean;
	hasVoted: boolean;
	voteCount: number;
	upVotePercent: number;
};

export type StoreDetailsProduct = {
	productId: number;
	price: number | null;
	isForSaleOrIsPublicDomain: boolean;
};

export type StoreDetailsPriceQuantity = {
	significand: number;
	exponent: number;
};

export type StoreDetailsPurchasePrice = {
	currencyCode?: string;
	quantity?: StoreDetailsPriceQuantity;
};

export type StoreDetailsFiatProduct = {
	purchasePrice?: StoreDetailsPurchasePrice;
	published?: boolean;
	purchasable: boolean;
};

export type StoreAssetDetails = {
	asset: StoreAssetDetailsAsset;
	creator: StoreDetailsCreator;
	voting: StoreDetailsVoting;
	product?: StoreDetailsProduct;
	fiatProduct?: StoreDetailsFiatProduct;
};

export type MultigetToolboxAssetsByIdsRequest = {
	assetIds: number[];
};

export type MultigetToolboxAssetsByIdsResponse = {
	data: StoreAssetDetails[];
};

export type ListedAssetVersionStatus = "Published" | "Any";

export type MultigetLatestAssetsVersionsRequest = {
	assetIds: number[];
	versionStatus: ListedAssetVersionStatus;
};

export type ListedLatestAssetVersion = {
	assetId: number;
	versionNumber: number;
	status: "Success";
};

export type MultigetLatestAssetsVersionsResponse = {
	results: ListedLatestAssetVersion[];
};

export type GetToolboxAssetByIdRequest = {
	assetId: number;
};

export type ToolboxAssetV2Creator = {
	creator: string;
	userId?: number;
	name: string;
	verified: boolean;
};

export type ToolboxAssetV2 = {
	id: number;
	name: string;
	description: string;
	assetTypeId: number;
	socialLinks?: StoreSocialLink[] | null;
	previewAssets?: StoreDetailsPreviewAssets;
	createTime: string;
	updateTime: string;
};

export type GetToolboxAssetByIdResponse = {
	voting: StoreDetailsVoting;
	creator: ToolboxAssetV2Creator;
	creatorStoreProduct: StoreDetailsFiatProduct;
	asset: ToolboxAssetV2;
};

export type ListAssetOwnersRequest = {
	assetId: number;
	limit?: number;
	cursor?: string;
	sortOrder?: SortOrder;
};

export type ListedAssetOwner = {
	id: number;
	type: Agent;
	// usually always null
	name: string | null;
};

export type ListedAssetOwnerInstance = {
	id: number;
	collectibleItemInstanceId: string;
	serialNumber?: number | null;
	owner?: ListedAssetOwner | null;
	created: string;
	updated: string;
};

export type ListAssetOwnersResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: ListedAssetOwnerInstance[];
};

export function getLessAssetById({ assetId, overrideCache }: GetAssetByIdRequest) {
	return getOrSetCache({
		key: ["assets", assetId, "legacyDetails"],
		fn: async () =>
			(
				await httpClient.httpRequest<GeneralLessAssetDetails>({
					url: `${getRobloxUrl("economy")}/v2/developer-products/${assetId}/info`,
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
				})
			).body,
		overrideCache,
	});
}

export function getAssetById({ assetId, overrideCache }: GetAssetByIdRequest) {
	return getOrSetCache({
		key: ["assets", assetId, "details"],
		fn: async () =>
			(
				await httpClient.httpRequest<GeneralAssetDetails>({
					url: `${getRobloxUrl("economy")}/v2/assets/${assetId}/details`,
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
				})
			).body,
		overrideCache,
	});
}
export function getCreatorAssetById({ assetId, overrideCache }: GetAssetByIdRequest) {
	return getOrSetCache({
		key: ["assets", assetId, "creatorDetails"],
		fn: async () =>
			(
				await httpClient.httpRequest<CreatorAssetDetails>({
					url: `${getRobloxUrl("apis")}/assets/user-auth/v1/assets/${assetId}`,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
			).body,
		overrideCache,
	});
}

export function multigetDevelopAssetsByIds({
	overrideCache,
	...request
}: MultigetDevelopAssetsByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["assets", "developDetails"],
		keys: request.assetIds.map((assetId) => ({
			id: assetId,
		})),
		fn: (assets) =>
			httpClient
				.httpRequest<MultigetDevelopAssetsByIdsResponse>({
					url: getRobloxUrl("develop", "/v1/assets"),
					search: {
						assetIds: assets.map((asset) => asset.id),
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => {
					const items: Record<number, DevelopAsset> = {};
					for (const asset of data.body.data) {
						items[asset.id] = asset;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 50,
	});
}

export function requestAssetContents({ assetId }: RequestAssetContentsRequest) {
	return getOrSetCache({
		key: ["assets", assetId, "contents"],
		fn: async () =>
			(
				await httpClient.httpRequest<RequestAssetContentsResponse>({
					url: `${getRobloxUrl("assetdelivery")}/v2/assetId/${assetId}`,
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
				})
			).body,
	});
}

export function requestAssetContentsByVersion({
	assetId,
	versionNumber,
}: RequestAssetContentsByVersionRequest) {
	return getOrSetCache({
		key: ["assets", assetId, "versions", versionNumber, "contents"],
		fn: async () =>
			(
				await httpClient.httpRequest<RequestAssetContentsResponse>({
					url: `${getRobloxUrl(
						"assetdelivery",
					)}/v2/assetId/${assetId}/version/${versionNumber}`,
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
				})
			).body,
	});
}

export async function batchGetAssetsContents({
	requests,
	robloxPlaceId,
	inBrowserRequest,
}: BatchGetAssetsContentsRequest) {
	return (
		await httpClient.httpRequest<RequestAssetContentsResponse[]>({
			url: getRobloxUrl("assetdelivery", "/v2/assets/batch"),
			method: "POST",
			body: {
				type: "json",
				value: requests,
			},
			headers: {
				[ROBLOX_PLACE_ID_HEADER_NAME]: robloxPlaceId,
				[ROBLOX_BROWSER_ASSET_REQUEST_HEADER_NAME]: inBrowserRequest ? "true" : undefined,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function uploadAsset({
	request,
	fileContent,
}: UploadAssetRequest): Promise<UploadAssetResponse> {
	return (
		await httpClient.httpRequest<UploadAssetResponse>({
			url: getRobloxUrl("apis", "/assets/user-auth/v1/assets"),
			method: "POST",
			body: {
				type: "formdata",
				value: {
					request: {
						value: JSON.stringify(request),
					},
					fileContent: {
						value: fileContent,
					},
				},
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getOperationDetails({
	operationId,
}: GetOperationDetailsRequest): Promise<UploadAssetResponse> {
	return (
		await httpClient.httpRequest<UploadAssetResponse>({
			url: `${getRobloxUrl("apis")}/assets/user-auth/v1/operations/${operationId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function multigetToolboxAssetsByIds({ assetIds }: MultigetToolboxAssetsByIdsRequest) {
	return (
		await httpClient.httpRequest<MultigetToolboxAssetsByIdsResponse>({
			url: getRobloxUrl("apis", "/toolbox-service/v1/items/details"),
			search: {
				assetIds: assetIds,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getToolboxAssetById({ assetId }: GetToolboxAssetByIdRequest) {
	return (
		await httpClient.httpRequest<GetToolboxAssetByIdResponse>({
			url: `${getRobloxUrl("apis")}/toolbox-service/v2/assets/${assetId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function multigetLatestAssetsVersions(request: MultigetLatestAssetsVersionsRequest) {
	return (
		await httpClient.httpRequest<MultigetLatestAssetsVersionsResponse>({
			method: "POST",
			url: getRobloxUrl("develop", "/v1/assets/latest-versions"),
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listAssetOwners({ assetId, ...request }: ListAssetOwnersRequest) {
	return (
		await httpClient.httpRequest<ListAssetOwnersResponse>({
			url: `${getRobloxUrl("inventory")}/v2/assets/${assetId}/owners`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}
