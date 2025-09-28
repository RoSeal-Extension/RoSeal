import type { AgentIncludingAll } from "src/ts/constants/marketplace.ts";
import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { filterObject } from "src/ts/utils/objects.ts";
import { getOrSetCache, getOrSetCaches } from "../../cache.ts";
import { renderGenericChallenge } from "../../domInvokes.ts";
import { httpClient } from "../main.ts";
import type { Agent } from "./assets.ts";
import type { AvatarAssetMeta, AvatarColors3s, AvatarType, ScalesScalable } from "./avatar.ts";
import type { SortOrder } from "./badges.ts";

export type AnyItemType = "Asset" | "Bundle" | "Badge" | "GamePass" | "DeveloperProduct" | "Look";
export type LiterallyAnyItemType =
	| AnyItemType
	| "Group"
	| "PrivateServer"
	| "Universe"
	| "UserOutfit"
	| "ExperienceEvent"
	| "Subscription";

export type MarketplaceItemType = "Asset" | "Bundle";

export type SearchedItem = {
	id: number;
	itemType: MarketplaceItemType;
};

export type SearchItemsResponse = {
	keyword: string | null;
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: SearchedItem[];
};

export enum MarketplaceSalesTypeFilter {
	All = 1,
	Collectibles = 2,
	Premium = 3,
}

export enum MarketplaceSortType {
	Relevance = 1,
	PriceHighToLow = 2,
	PriceLowToHigh = 3,
	MostFavorited = 4,
	RecentlyCreated = 5,
	Bestselling = 6,
}

export enum MarketplaceAggregationType {
	Past12Hours = 1,
	PastDay = 2,
	Past3Days = 3,
	PastWeek = 4,
	PastMonth = 5,
	AllTime = 6,
}

export enum MarketplaceCategoryFilterV2 {
	None = 1,
	Featured = 2,
	Collectibles = 3,
	CommunityCreations = 4,
	Premium = 5,
	Recommended = 6,
}

export type SearchItemsRequestV2 = {
	assetTypeIds?: number[];
	bundleTypeIds?: number[];
	categoryFilter?: MarketplaceCategoryFilterV2 | number;
	sortAggregation?: MarketplaceAggregationType;
	sortType?: MarketplaceSortType;
	creatorType?: AgentIncludingAll;
	creatorTargetId?: number;
	creatorName?: string;
	minPrice?: number;
	maxPrice?: number;
	keyword?: string;
	includeNotForSale?: boolean;
	triggeredByTopicDiscovery?: boolean;
	salesTypeFilter?: MarketplaceSalesTypeFilter;
	topics?: string[];
	limit?: number;
	cursor?: string;
	sortOrder?: SortOrder;
};

export type SearchItemsRequest = {
	keyword?: string;
	limit?: number;
	category?: string | number;
	subcategory?: string | number;
	sortAggregation?: MarketplaceAggregationType;
	sortCurrency?: number;
	sortOrder?: SortOrder;
	sortType?: MarketplaceSortType;
	includeNotForSale?: boolean;
	creatorType?: AgentIncludingAll;
	creatorTargetId?: number;
	creatorName?: string;
	maxPrice?: number;
	minPrice?: number;
	tagNames?: string[];
	triggeredByTopicDiscovery?: boolean;
	salesTypeFilter?: MarketplaceSalesTypeFilter;
	cursor?: string;
};

export type PurchaseCollectibleItemRequest = {
	collectibleItemId: string;
	expectedCurrency: number;
	expectedPrice: number;
	expectedPurchaserId: string;
	expectedPurchaserType: "User";
	expectedSellerId: number;
	expectedSellerType: Agent;
	idempotencyKey: string;
	collectibleProductId: string;
};

export type PurchaseCollectibleErrorMessage =
	| "QuantityExhausted"
	| "InsufficientBalance"
	| "PriceMismatch"
	| "Flooded";

export type PurchaseCollectibleItemResponse = {
	purchased: boolean;
	purchaseResult: string;
	pending: boolean;
	errorMessage?: PurchaseCollectibleErrorMessage;
};

export type CollectibleExperience = {
	id: number;
	name: string;
	detailPageLink: string;
};

export type CollectibleSaleSchedule = {
	onSaleTime?: string;
	offSaleTime?: string;
};

export type Collectible = {
	collectibleItemId: string;
	collectibleProductId: string;
	creatorType: Agent;
	creatorName: string;
	creatorHasVerifiedBadge: boolean;
	itemTargetId: number;
	itemTargetType: 1 | 2;
	// See CollectibleItemType
	itemType: 0 | 1 | 2;
	lowestPrice: number;
	creatorId: number;
	price: number;
	unitsAvailableForConsumption: number;
	assetStock: number;
	name: string;
	description: string;
	errorCode: number | null;
	itemRestrictions: null;
	saleLocationType: AvatarItemSaleLocationType;
	universeIds?: number[];
	experiences?: CollectibleExperience[] | null;
	sales?: number;
	lowestResalePrice?: number;
	offSaleDeadline?: string;
	quantityLimitPerUser: number;
	lowestAvailableResaleProductId: string | null;
	lowestAvailableResaleItemInstanceId: string | null;
	// Seee CollectibleResaleStatus
	resaleRestriction: 0 | 1 | 2;
	// See CollectibleSaleStatus
	productSaleStatus: 0 | 1 | 2 | 3 | 4;
	productTargetId: number;
	saleSchedule: CollectibleSaleSchedule | null;
};

export type PurchaseItemRequest = {
	productId: number;
	expectedCurrency: 1;
	expectedPrice: number;
	expectedSellerId: number;
	expectedPromoId?: number;
	userAssetId?: number;
	saleLocationType?: string;
	saleLocationId?: number;
};

export type TransactionVerbType = "bought" | "rented" | "renewed";
export type ShowDivIdType = "TransactionFailureView" | "InsufficientFundsView" | "PriceChangedView";

export type PurchaseProductReason =
	| "Success"
	| "AlreadyOwned"
	| "ApplicationError"
	| "EconomyDisabled"
	| "InsufficientFunds"
	| "InsufficientMembership"
	| "InvalidTransaction"
	| "NotAvailableInRobux"
	| "NotForSale"
	| "PriceChanged"
	| "SaleExpired"
	| "SupplyExausted"
	| "ContentRatingRestricted"
	| "UnknownBirthday"
	| "AffiliateSalesDisabled"
	| "BadAffiliateSaleProduct"
	| "ExceptionOccurred"
	| "IOSOnlyItem"
	| "InvalidArguments"
	| "TooManyPurchases"
	| "Unauthorized"
	| "AccountRestrictionsRestricted"
	| "PendingTransactionAlreadyExists"
	| "SaleUnavailableAtSaleLocation"
	| "TwoStepVerificationRequired"
	| "UnexpectedSeller"
	| "PendingTransactionAlreadyExists";

export type PurchaseItemResponse = {
	purchased: boolean;
	reason: PurchaseProductReason;
	productId: number;
	currency: number;
	assetName: string;
	assetType: string;
	assetTypeDisplayName: string;
	assetIsWearable: boolean;
	sellerName: string;
	transactionVerb: TransactionVerbType;
	isMultiPrivateSale: boolean;
	statusCode: number;
	title: string;
	errorMsg: string;
	showDivId: ShowDivIdType;
	shortFallPrice: number;
	balanceAfterSale: number;
	expectedPrice: number;
	price: number;
};

export type AvatarItemRequest<T extends MarketplaceItemType> = {
	id: number;
	itemType: T;
};

export type MultigetAvatarItemsRequest<T extends MarketplaceItemType> = {
	overrideCache?: boolean;
	items: AvatarItemRequest<T>[];
};

export type BundledItemType = "Asset" | "UserOutfit";

export type BundledItem = {
	owned: boolean;
	id: number;
	name: string;
	type: BundledItemType;
};

export type AvatarItemStatus =
	| "New"
	| "Sale"
	| "SaleTimer"
	| "XboxExclusive"
	| "IosExclusive"
	| "GooglePlayExclusive"
	| "AmazonExclusive";

export type AvatarItemRestriction =
	| "ThirteenPlus"
	| "LimitedUnique"
	| "Limited"
	| "BuildersClub"
	| "TurboBuildersClub"
	| "OutrageousBuildersClub"
	| "Rthro"
	| "Live"
	| "Collectible";

export type AvatarItemSaleLocationTypeId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvatarItemSaleLocationType =
	| "NotApplicable"
	| "ShopOnly"
	| "MyExperiencesOnly"
	| "ShopAndMyExperiences"
	| "ExperiencesById"
	| "ShopAndAllExperiences"
	| "ExperiencesDevApiOnly"
	| "ShopAndExperiencesById";

export type AvatarItemDetail<T extends MarketplaceItemType> = {
	id: number;
	itemType: T;
	assetType: T extends "Asset" ? number : never;
	bundleType: T extends "Bundle" ? number : never;
	name: string;
	description: string;
	productId?: number | null;
	bundledItems: T extends "Bundle" ? BundledItem[] : never;
	isRecolorable: T extends "Bundle" ? boolean : never;
	itemStatus: AvatarItemStatus[];
	itemRestrictions: AvatarItemRestriction[];
	creatorHasVerifiedBadge: boolean;
	creatorType: Agent;
	creatorTargetId: number;
	creatorName: string;
	price?: number | number;
	lowestPrice: number;
	lowestResalePrice: number;
	priceStatus: string;
	unitsAvailableForConsumption: number;
	favoriteCount: number;
	offSaleDeadline?: string | null;
	collectibleItemId?: string;
	totalQuantity?: number;
	saleLocationType: AvatarItemSaleLocationType;
	hasResellers: boolean;
	isOffSale: boolean;
	quantityLimitPerUser: number;
};

export type MultigetAvatarItemsResponse<T extends MarketplaceItemType> = {
	data: AvatarItemDetail<T>[];
};

export type GetItemBundlesRequest = {
	assetId: number;
	limit?: number;
	sortOrder?: string;
};

export type AvatarBundleType = "DynamicHead" | "BodyParts" | "AvatarAnimations" | "Shoes";

export type AvatarBundleItemType = "UserOutfit" | "Asset";

export type AvatarBundleItem = {
	owned: boolean;
	id: number;
	name: string;
	type: AvatarBundleItemType;
};

export type AvatarBundleProduct = {
	id: number;
	type: string;
	isPublicDomain: boolean;
	isForSale: boolean;
	priceInRobux: number;
	isFree: boolean;
	noPriceText: string | null;
};

export type GenericMarketplaceCreator = {
	id: number;
	name: string;
	type: Agent;
	hasVerifiedBadge: boolean;
};

export type AvatarBundle = {
	id: number;
	name: string;
	isRecolorable: boolean;
	description: string;
	bundleType: AvatarBundleType;
	items: AvatarBundleItem[];
	creator: GenericMarketplaceCreator;
	product?: AvatarBundleProduct;
	itemRestrictions: AvatarItemRestriction[];
	collectibleItemDetail?: BundleDetailCollectible;
};

export type GetItemBundlesResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: AvatarBundle[];
};

export type AvatarItem<T extends MarketplaceItemType> = {
	itemCreatedUtc: string;
	isPBR?: boolean;
	expectedSellerId: number;
	owned: boolean;
	isRecolorable?: boolean;
	isPurchasable: boolean;
	creatingUniverseId: number | null;
	id: number;
	itemType: T;
	assetType: T extends "Asset" ? number : never;
	bundleType: T extends "Bundle" ? number : never;
	name: string;
	description: string;
	productId?: number;
	genres: string[];
	bundledItems: T extends "Bundle" ? BundledItem[] : never;
	itemStatus?: string;
	itemRestrictions: string[];
	creatorHasVerifiedBadge: boolean;
	creatorType: Agent;
	creatorTargetId: number;
	creatorName: string;
	price: number;
	lowestPrice?: number;
	lowestResalePrice?: number;
	priceStatus: string;
	unitsAvailableForConsumption: number;
	purchaseCount?: number;
	favoriteCount?: number;
	offSaleDeadline?: string;
	collectibleItemId: string | null;
	totalQuantity: number;
	saleLocationType: AvatarItemSaleLocationType;
	hasResellers: boolean;
	isOffSale: boolean;
	quantityLimitPerUser: number;
};

export type GetAvatarItemRequest<T extends MarketplaceItemType> = {
	overrideCache?: boolean;
	itemType: T;
	itemId: number;
};

export type MultigetCollectibleItemsByIdsRequest = {
	overrideCache?: boolean;
	itemIds: string[];
};

export type MultigetBundlesByIdsRequest = {
	overrideCache?: boolean;
	bundleIds: number[];
};

// 0 = Invalid, Draft = 1, OffSale = 2, OnSale = 3, PendingSale = 4
export type CollectibleSaleStatus = "Invalid" | "Draft" | "OffSale" | "OnSale" | "PendingSale";

// None = 0, Invalid = 1, Disabled = 2
export type CollectibleResaleRestriction = "None" | "Invalid" | "Disabled";

// 0 = Invalid, Limited = 1, NonLimited = 2
export type CollectibleItemType = "Invalid" | "Limited" | "NonLimited";

export type BundleDetailCollectible = {
	collectibleItemId: string;
	collectibleProductId: string;
	price: number;
	lowestPrice: number;
	lowestResalePrice: number;
	totalQuantity: number;
	unitsAvailable: number;
	saleLocation: {
		saleLocationType: AvatarItemSaleLocationType;
		saleLocationTypeId: AvatarItemSaleLocationTypeId;
		universeIds: number[];
		enabledUniverseIds: number[];
	};
	hasResellers: boolean;
	saleStatus: CollectibleSaleStatus;
	quantityLimitPerUser: number | null;
	offSaleDeadline: string | null;
	collectibleItemType: CollectibleItemType;
	lowestAvailableResaleProductId: string | null;
	lowestAvailableResaleItemInstanceId: string | null;
	resaleRestriction: CollectibleResaleRestriction;
};

export type BundleDetail = MappedOmit<AvatarBundle, "itemRestrictions"> & {
	collectibleItemDetail?: BundleDetailCollectible;
};

export type GetLookByIdRequest = {
	lookId: bigint | string;
};

export type LookError = {
	code: string;
	messages: string[];
};

export type LookItemBundleAsset = {
	itemType: MarketplaceItemType;
	id: number;
	isIncluded: boolean;
	meta?: AvatarAssetMeta | null;
};

export type LookItemDetails<T extends MarketplaceItemType> = {
	assetType: T extends "Asset" ? number : null;
	bundleType: T extends "Bundle" ? number : null;
	creator: GenericMarketplaceCreator;
	assetsInBundle: T extends "Bundle" ? LookItemBundleAsset[] : null;
	noPriceStatus: string | null;
	itemRestrictions: AvatarItemRestriction[];
	id: number;
	name: string;
	description: string;
	priceInRobux: number | null;
	productId: number;
	collectibleItemId: string | null;
	collectibleProductId: string | null;
	isPurchasable: boolean;
	quantityOwned: number;
	meta?: AvatarAssetMeta | null;
	itemType: T;
};

export type LookType = "Outfit" | "Avatar";

export type LookAvatarProperties = {
	scale: ScalesScalable;
	bodyColors3s: AvatarColors3s;
	playerAvatarType: AvatarType;
};

export type LookModerationStatus = "Invalid";

export type LookDisplayProperties = {
	backgroundType?: string | null;
	backgroundValue?: string | number | null;
	emoteAssetId?: number | null;
};

export type LookDetails = {
	lookId: string;
	items: LookItemDetails<MarketplaceItemType>[];
	curator?: GenericMarketplaceCreator;
	totalValue: number;
	totalPrice: number;
	createdTime: string;
	updatedTime: string;
	lookType: LookType;
	moderationStatus: LookModerationStatus;
	name: string;
	description: string;
	avatarProperties: LookAvatarProperties | null;
	displayProperties: LookDisplayProperties | null;
};

export type GetLookByIdResponse = {
	look?: LookDetails;
	error: LookError | null;
};

export type SearchMarketplaceWidgetsRequest = {
	requestId: string;
	query: string;
};

export type MarketplaceWidgetType =
	| "OrganicContent"
	| "ThemedAvatarItemsWidget"
	| "SearchToAvatarLooksWidget"
	| "NewToMarketplaceWidget"
	| "TrendingWidget"
	| "SearchToCommunityLooksWidget"
	| "InExperienceShopWidget"
	| "ProfilePictureEditorWidget"
	| "CurationWidget"
	| "PersonalizedAvatarLooksWidget";

export type MarketplaceWidgetItemType = "Look" | "Asset" | "Bundle" | "Experience";

export type MarketplaceWidgetItem<T extends MarketplaceWidgetItemType> = {
	type: T;
	id: string;
};

export type MarketplaceWidgetItemFooter = {
	contentType: string;
};

export type MarketplaceWidgetTemplate = {
	type: "ItemGroup";
	seeAllButton: boolean;
	title: string | null;
	localizedTitle?: string;
	localizedDescription?: string;
	style: {
		widgetBackground: "Unspecified";
		headerStyle: "Unspecified";
		previewRows: Record<string, number>;
	};
	itemFooters: MarketplaceWidgetItemFooter[];
};
export type MarketplaceWidget<T extends MarketplaceWidgetType> = {
	id: string;
	type: T;
	content: MarketplaceWidgetItem<
		T extends "SearchToAvatarLooksWidget" ? "Look" : MarketplaceWidgetItemType
	>[];
	template: MarketplaceWidgetTemplate;
};

export type MarketplaceWidgetsConfiguration = {
	customizedDataMap: Record<string, string>;
	defaultTemplate: MarketplaceWidgetTemplate;
};

export type GetMarketplaceWidgetsResponse = {
	configuration: MarketplaceWidgetsConfiguration;
	widgets: Record<string, MarketplaceWidget<MarketplaceWidgetType>>;
};

export type MarketplaceWidgetContext =
	| "catalog-tab:all"
	| "catalog-tab:accessories"
	| "catalog-tab:body"
	| "catalog-tab:clothing"
	| "catalog-tab:allanimations"
	| "catalog-tab:characters"
	| "catalog-tab:heads";

export type GetMarketplaceWidgetsRequest = {
	requestId: string;
	context: MarketplaceWidgetContext;
};

export type HydrateMarketplaceWidgetRequest = {
	overrideCache?: boolean;
	content: MarketplaceWidgetItem<MarketplaceWidgetItemType>[];
};

export type HydratedWidgetLook = {
	type: "Look";
	id: string;
	curator: GenericMarketplaceCreator;
	assetHashId: number;
	assets: HydratedWidgetMarketplaceItem<"Asset">[];
	bundles: HydratedWidgetMarketplaceItem<"Bundle">[];
	createdTime: string;
	updatedTime: string;
	lookType: LookType;
	totalPrice: number;
	totalValue: number;
	name?: string;
};

export type HydratedWidgetMarketplaceItem<T extends MarketplaceItemType> = {
	type: T;
	assetType: T extends "Asset" ? string : never;
	bundleType: T extends "Bundle" ? string : never;
	order?: number | null;
	id: number;
};

export type HydratedWidgetExperience = {
	name: string;
	description: string;
	totalUpVotes: number;
	totalDownVotes: number;
	playerCount: number;
	type: "Experience";
	id: number;
};

export type HydratedWidgetSkinnyCreator = {
	name: string;
	hasVerifiedBadge: boolean;
};

export type HydratedWidgetBundle = {
	type: "Bundle";
	bundleType: AvatarBundleType;
	name: string;
	price: number;
	creatorName: string;
	creator: HydratedWidgetSkinnyCreator;
	id: number;
};

export type HydratedWidgetAsset = {
	type: "Asset";
	assetType: string;
	order: number | null;
	name: string;
	price?: number;
	creatorName: string;
	creator: HydratedWidgetSkinnyCreator;
	id: number;
};

export type HydratedWidgetItem =
	| HydratedWidgetLook
	| HydratedWidgetAsset
	| HydratedWidgetBundle
	| HydratedWidgetExperience;

export type HydrateMarketplaceWidgetResponse = {
	hydratedContent: HydratedWidgetItem[];
};

export type MarketplaceAnalyticsSortOrder = "Revenue" | "SalesCount" | "CreatedTime";

export type MarketplaceAnalyticsFilterDimension =
	| "Keyword"
	| "TargetType"
	| "TargetId"
	| "SalesType";

export type MarketplaceAnalyticsFilter = {
	dimension: MarketplaceAnalyticsFilterDimension;
	values: string[];
};

export type MarketplaceAnalyticsPagination = {
	pageSize?: number;
	paginationToken?: string;
};

export type QueryMarketplaceAnalyticsRequest = {
	ownerType: Agent;
	ownerId: number;
	startTime?: string;
	endTime: string;
	sortOrder?: MarketplaceAnalyticsSortOrder;
	pagination?: MarketplaceAnalyticsPagination;
	filters?: MarketplaceAnalyticsFilter[];
};

export type SalesType = "Unlimited" | "Limited";

export type MarketplaceAnalytics = {
	name: string;
	salesType: SalesType;
	targetIdString: string;
	totalQuantity: number | null;
	quantityLeft: number | null;
	targetId: number;
	targetType: string;
	salesCount: number;
	revenue: number;
	price: number;
	isOnSale: boolean;
	createdTime: string;
};

export type QueryMarketplaceAnalyticsResponse = {
	values: MarketplaceAnalytics[];
	nextPaginationToken: string | null;
	total: number;
};

export type AllowedCollectibleType = {
	MinPrice: number;
	MaxPrice: number;
	MinQuantity: number;
};

export type ItemPriceFloor = {
	priceFloor: number;
};

export type GetCollectiblesMetadataResponse = {
	isCollectiblesControllerEnabled: boolean;
	isCollectiblesPublishingEnabled: boolean;
	isCollectiblesPublishingLocationTypeEnabled: boolean;
	allowedCollectibleSaleLocations: number[];
	AllowedCollectiblesAssetTypes: Record<string, AllowedCollectibleType>;
	IsCollectibleFreeItemPublishingAvailable: boolean;
	isCollectibleGroupPublishingAvailable: boolean;
	isCollectibleResaleRestrictionsEnabled: boolean;
	isCollectiblePublishMinQuantityEnabled: boolean;
	unlimitedItemPriceFloors: Record<string, ItemPriceFloor>;
	limitedItemPriceFloors: Record<string, ItemPriceFloor>;
	AllowedCollectiblesBundleTypes: Record<string, AllowedCollectibleType>;
	IsUgc4AllUIEnabled: boolean;
	LimitedMaxQuantity: number;
	IsLimitedCollectibleBundlesPublishingEnabled: boolean;
	IsResellabilityEnabled: boolean;
	IsNewBundleUIEnabled: boolean;
};

export type AllowedAssetTypeUpload = {
	allowedFileExtensions: string[];
};

export type AllowedReleasePriceRange = {
	minRobux: number;
	maxRobux: number;
};

export type AllowedAssetTypeRelease = {
	allowedPriceRange: AllowedReleasePriceRange;
	marketplaceFeesPercentage: number;
};

export type GetItemConfigurationMetadataResponse = {
	allowedAssetTypesForUpload: Record<string, AllowedAssetTypeUpload>;
	allowedAssetTypesForRelease: Record<string, AllowedAssetTypeRelease>;
	allowedAssetTypesForFree: string[];
	allowedAssetTypesForSaleAvailabilityLocations: string[];
	allowedAssetTypesForCreatorDashboard: string[];
	canPublishUnlimitedItems: boolean;
};

export type SearchItemsDetailsResponse<T extends MarketplaceItemType> = {
	keyword: string | null;
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: AvatarItemDetail<T>[];
};

export type GetMarketplaceItemTagsRequest = {
	itemIds: (`AssetId:${number}` | `BundleId:${number}`)[];
};

export type MarketplaceItemTagDetail = {
	tagId: string;
	name: string;
	localizedDisplayName: string;
	status: "Success" | "Failure";
};

export type MarketplaceItemTag = {
	id: string;
	tag: MarketplaceItemTagDetail;
};

export type MarketplaceItemWithTags = {
	id: number;
	itemTags: MarketplaceItemTag[];
};

export type GetMarketplaceItemTagsResponse = {
	data: MarketplaceItemWithTags[];
};

export type GetCollectibleResaleDataRequest = {
	collectibleItemId: string;
};

export type ResaleDataPoint = {
	date: string;
	value: number;
};
export type GetCollectibleResaleDataResponse = {
	priceDataPoints: ResaleDataPoint[];
	volumeDataPoints: ResaleDataPoint[];
	recentAveragePrice: number;
};

export type GetItemCollectibleIdRequest = {
	itemId: number;
	itemType: MarketplaceItemType;
};

export type GetItemCollectibleIdResponse = {
	collectibleItemId: string | null;
};

export type CollectibleResellerSeller = {
	hasVerifiedBadge: boolean;
	sellerId: number;
	sellerType: Agent;
	name: string;
};

export type CollectibleReseller = {
	collectibleProductId: string;
	collectibleItemInstanceId: string;
	seller: CollectibleResellerSeller;
	price: number;
	serialNumber: number | null;
	errorMessage: null | string;
};

export type ListCollectibleResellersRequest = {
	collectibleItemId: string;
	limit: number;
};

export type ListCollectibleResellersResponse = {
	data: CollectibleReseller[];
	previousPageCursor: string | null;
	nextPageCursor: string | null;
};

export type SponsoredItemsPlacementLocation = "AvatarShop" | "ItemDetails";

export type PostSponsoredItemClickRequest = {
	campaignTargetType: MarketplaceItemType;
	placementLocation: SponsoredItemsPlacementLocation;
	encryptedAdTrackingData: string;
};

export type ListSponsoredItemsRequest = {
	placementLocation: SponsoredItemsPlacementLocation;
	catalogCategoryType?: string;
	count: number;
};

export type ListedSponsoredItem = {
	id: number;
	itemType: MarketplaceItemType;
	encryptedAdTrackingData: string;
};

export type ListSponsoredItemsResponse = {
	data: ListedSponsoredItem[];
};

export type ListCollectibleResellableInstancesRequest = {
	collectibleItemId: string;
	ownerType: Agent;
	ownerId: number;
	limit: number;
	cursor?: string;
};

export type ResellableCollectibleInstanceSaleStatus = "OffSale";

export type ResellableCollectibleInstance = {
	collectibleInstanceId: string;
	collectibleItemId: string;
	collectibleProductId: string;
	serialNumber: number | null;
	isHeld: boolean;
	saleState: string;
	price: number;
};

export type ListCollectibleResellableInstancesResponse = {
	itemInstances: ResellableCollectibleInstance[];
	previousPageCursor: string;
	nextPageCursor: string;
};

export type GetCollectibleResaleParametersResponse = {
	minimumFee: number;
	priceFloor: number;
	resalePercentageFee: number;
	resellableLimitedItemPriceFloors: Record<string, number>;
};

export type ItemSocialConnectionType = "Friend";

export type ListItemSocialConnectionsRequest = {
	entityId: number;
	connectionType: ItemSocialConnectionType;
	entityType: MarketplaceItemType;
};

export type ListedItemSocialConnection = {
	id: number;
	type: ItemSocialConnectionType;
};

export type ListItemSocialConnectionsResponse = {
	connections: ListedItemSocialConnection[];
	totalCount: number;
	cursor: string;
};

export async function searchItems(request: SearchItemsRequest): Promise<SearchItemsResponse> {
	return (
		await httpClient.httpRequest<SearchItemsResponse>({
			url: getRobloxUrl("catalog", "/v1/search/items"),
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function searchItemsDetails<T extends MarketplaceItemType>(
	request: SearchItemsRequest,
) {
	return (
		await httpClient.httpRequest<SearchItemsDetailsResponse<T>>({
			url: getRobloxUrl("catalog", "/v1/search/items/details"),
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function searchItemsDetailsV2<T extends MarketplaceItemType>({
	assetTypeIds,
	bundleTypeIds,
	...request
}: SearchItemsRequestV2) {
	const searchParams = new URLSearchParams(
		filterObject(request) as unknown as Record<string, string>,
	);

	if (assetTypeIds)
		for (const assetTypeId of assetTypeIds) {
			searchParams.append("assetTypeIds", assetTypeId.toString());
		}

	if (bundleTypeIds) {
		for (const bundleTypeId of bundleTypeIds) {
			searchParams.append("bundleTypeIds", bundleTypeId.toString());
		}
	}

	return (
		await httpClient.httpRequest<SearchItemsDetailsResponse<T>>({
			url: getRobloxUrl("catalog", "/v2/search/items/details"),
			search: searchParams,
			includeCredentials: true,
		})
	).body;
}

export async function purchaseItem({
	productId,
	...request
}: PurchaseItemRequest): Promise<PurchaseItemResponse> {
	return (
		await httpClient.httpRequest<PurchaseItemResponse>({
			method: "POST",
			url: `${getRobloxUrl("economy")}/v1/purchases/products/${productId}`,
			body: {
				type: "json",
				value: request,
			},
			handleChallenge: renderGenericChallenge,
			includeCredentials: true,
		})
	).body;
}

export async function purchaseCollectibleItem({
	collectibleItemId,
	...request
}: PurchaseCollectibleItemRequest): Promise<PurchaseCollectibleItemResponse> {
	return (
		await httpClient.httpRequest<PurchaseCollectibleItemResponse>({
			method: "POST",
			url: `${getRobloxUrl(
				"apis",
			)}/marketplace-sales/v1/item/${collectibleItemId}/purchase-item`,
			body: {
				type: "json",
				value: { ...request, collectibleItemId },
			},
			handleChallenge: renderGenericChallenge,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getCollectibleResaleData({
	collectibleItemId,
}: GetCollectibleResaleDataRequest): Promise<GetCollectibleResaleDataResponse> {
	return (
		await httpClient.httpRequest<GetCollectibleResaleDataResponse>({
			method: "GET",
			url: `${getRobloxUrl(
				"apis",
			)}/marketplace-sales/v1/item/${collectibleItemId}/resale-data`,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getCollectibleResaleParameters({
	collectibleItemId,
}: GetCollectibleResaleDataRequest): Promise<GetCollectibleResaleParametersResponse> {
	return (
		await httpClient.httpRequest<GetCollectibleResaleParametersResponse>({
			method: "GET",
			url: `${getRobloxUrl(
				"apis",
			)}/marketplace-sales/v1/item/${collectibleItemId}/get-resale-parameters`,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function listAssetToCategoryMapping() {
	return (
		await httpClient.httpRequest<Record<string, number>>({
			url: getRobloxUrl("catalog", "/v1/asset-to-category"),
		})
	).body;
}

export async function listAssetToSubcategoryMapping() {
	return (
		await httpClient.httpRequest<Record<string, number>>({
			url: getRobloxUrl("catalog", "/v1/asset-to-subcategory"),
		})
	).body;
}

export function multigetAvatarItems<T extends MarketplaceItemType>({
	overrideCache,
	...request
}: MultigetAvatarItemsRequest<T>) {
	return getOrSetCaches({
		baseKey: ["avatarItems", "details"],
		keys: request.items.map((item) => ({
			id: `${item.itemType}/${item.id}`,
			itemId: item.id,
			itemType: item.itemType,
		})),
		fn: (data) =>
			httpClient
				.httpRequest<MultigetAvatarItemsResponse<T>>({
					method: "POST",
					url: getRobloxUrl("catalog", "/v1/catalog/items/details"),
					body: {
						type: "json",
						value: {
							items: data.map((item) => ({
								id: item.itemId,
								itemType: item.itemType,
							})),
						},
					},
					includeCredentials: true,
				})
				.then((data) => {
					const items: Record<string, AvatarItemDetail<T>> = {};

					for (const item of data.body.data) {
						items[`${item.itemType}/${item.id}`] = item;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 50,
	});
}

export function getAvatarItem<T extends MarketplaceItemType>({
	overrideCache,
	itemType,
	itemId,
}: GetAvatarItemRequest<T>) {
	return getOrSetCache({
		key: ["avatarItems", `${itemType}/${itemId}`, "details"],
		fn: async () =>
			(
				await httpClient.httpRequest<AvatarItem<T> | null>({
					url: `${getRobloxUrl("catalog")}/v1/catalog/items/${itemId}/details`,
					search: {
						itemType,
					},
					includeCredentials: true,
				})
			).body || undefined,
		overrideCache,
	});
}

export async function getItemBundles({ assetId, ...request }: GetItemBundlesRequest) {
	return (
		await httpClient.httpRequest<GetItemBundlesResponse>({
			url: `${getRobloxUrl("catalog")}/v1/assets/${assetId}/bundles`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function listCollectibleResellers({
	collectibleItemId,
	...request
}: ListCollectibleResellersRequest) {
	return (
		await httpClient.httpRequest<ListCollectibleResellersResponse>({
			url: `${getRobloxUrl("apis")}/marketplace-sales/v1/item/${collectibleItemId}/resellers`,
			search: request,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function listCollectibleResellableInstances({
	collectibleItemId,
	...request
}: ListCollectibleResellableInstancesRequest) {
	return (
		await httpClient.httpRequest<ListCollectibleResellableInstancesResponse>({
			url: `${getRobloxUrl("apis")}/marketplace-sales/v1/item/${collectibleItemId}/resellable-instances`,
			search: request,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export function multigetCollectibleItemsByIds({
	overrideCache,
	...request
}: MultigetCollectibleItemsByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["avatarItems", "collectibleDetails"],
		keys: request.itemIds.map((id) => ({
			id,
		})),
		fn: (data) =>
			httpClient
				.httpRequest<Collectible[]>({
					method: "POST",
					url: getRobloxUrl("apis", "/marketplace-items/v1/items/details"),
					body: {
						type: "json",
						value: {
							itemIds: data.map((item) => item.id),
						},
					},
					errorHandling: "BEDEV2",
					includeCredentials: true,
				})
				.then((data) => {
					const items: Record<string, Collectible> = {};

					for (const item of data.body) {
						items[item.collectibleItemId] = item;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 50,
	});
}

export function multigetBundlesByIds({ overrideCache, ...request }: MultigetBundlesByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["avatarItems", "bundlesDetails"],
		keys: request.bundleIds.map((id) => ({
			id,
		})),
		fn: (bundleIds) =>
			httpClient
				.httpRequest<BundleDetail[]>({
					method: "GET",
					url: getRobloxUrl("catalog", "/v1/bundles/details"),
					search: {
						bundleIds: bundleIds.map((id) => id.id),
					},
					includeCredentials: true,
				})
				.then((data) => {
					const items: Record<string, BundleDetail> = {};

					for (const item of data.body) {
						items[item.id] = item;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 50,
	});
}

export function getLookById({ lookId }: GetLookByIdRequest) {
	return getOrSetCache({
		key: ["looks", lookId.toString()],
		fn: async () =>
			(
				await httpClient.httpRequest<GetLookByIdResponse>({
					url: `${getRobloxUrl("apis")}/look-api/v2/looks/${lookId}`,
					errorHandling: "BEDEV2",
					includeCredentials: true,
				})
			).body || undefined,
	});
}

export async function searchMarketplaceWidgets({
	requestId,
	...request
}: SearchMarketplaceWidgetsRequest) {
	return (
		await httpClient.httpRequest<GetMarketplaceWidgetsResponse>({
			url: getRobloxUrl("apis", "/marketplace-widgets/v1/widgets/search"),
			search: {
				...request,
				requestId: `{${requestId}}`,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getMarketplaceWidgets({
	requestId,
	...request
}: GetMarketplaceWidgetsRequest) {
	return (
		await httpClient.httpRequest<GetMarketplaceWidgetsResponse>({
			url: getRobloxUrl("apis", "/marketplace-widgets/v1/widgets"),
			search: {
				...request,
				requestId: `{${requestId}}`,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
			overridePlatformType: "Desktop",
		})
	).body;
}

export async function hydrateMarketplaceWidget({
	overrideCache,
	...request
}: HydrateMarketplaceWidgetRequest) {
	return getOrSetCaches({
		baseKey: ["marketplaceWidgets", "hydratedItems"],
		keys: request.content.map((id) => ({
			id: `${id.type}/${id.id}`,
			itemId: id.id,
			itemType: id.type,
		})),
		fn: (content) =>
			httpClient
				.httpRequest<HydrateMarketplaceWidgetResponse>({
					method: "POST",
					url: getRobloxUrl("apis", "/marketplace-widgets/v1/widgets/hydrate"),
					body: {
						type: "json",
						value: {
							content: content.map((item) => ({
								id: item.itemId,
								type: item.itemType,
							})),
						},
					},
					errorHandling: "BEDEV2",
					includeCredentials: true,
				})
				.then((data) => {
					const items: Record<string, HydratedWidgetItem> = {};

					for (const item of data.body.hydratedContent) {
						items[`${item.type}/${item.id}`] = item;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 50,
	});
}

export async function queryMarketplaceAnalytics({
	ownerType,
	ownerId,
	...request
}: QueryMarketplaceAnalyticsRequest) {
	return (
		await httpClient.httpRequest<QueryMarketplaceAnalyticsResponse>({
			method: "POST",
			url: `${getRobloxUrl("apis")}/developer-analytics-aggregations/v1/details/avatar/owner/${ownerType}/${ownerId}`,
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getItemCollectibleId({ itemType, itemId }: GetItemCollectibleIdRequest) {
	return (
		await httpClient.httpRequest<GetItemCollectibleIdResponse>({
			url: `${getRobloxUrl("itemconfiguration")}/v1/collectibles/${itemType}/${itemId}`,
			includeCredentials: true,
		})
	).body;
}

export async function getCollectiblesMetadata() {
	return (
		await httpClient.httpRequest<GetCollectiblesMetadataResponse>({
			url: getRobloxUrl("itemconfiguration", "/v1/collectibles/metadata"),
			// Do not camelize.
			includeCredentials: true,
		})
	).body;
}

export async function getItemConfigurationMetadata() {
	return (
		await httpClient.httpRequest<GetItemConfigurationMetadataResponse>({
			url: getRobloxUrl("itemconfiguration", "/v1/metadata"),
			// Do not camelize.
			includeCredentials: true,
		})
	).body;
}

export async function getMarketplaceItemTags(request: GetMarketplaceItemTagsRequest) {
	return (
		await httpClient.httpRequest<GetMarketplaceItemTagsResponse>({
			url: getRobloxUrl("itemconfiguration", "/v1/item-tags"),
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function postSponsoredItemClick(request: PostSponsoredItemClickRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: getRobloxUrl("adconfiguration", "/v2/tracking/click"),
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function listSponsoredItems(request: ListSponsoredItemsRequest) {
	return (
		await httpClient.httpRequest<ListSponsoredItemsResponse>({
			url: getRobloxUrl("catalog", "/v1/catalog/sponsored-items"),
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function listItemSocialConnections(request: ListItemSocialConnectionsRequest) {
	return (
		await httpClient.httpRequest<ListItemSocialConnectionsResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/social-proof-api/v1/social-proof/entity/connections"),
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			overridePlatformType: "Desktop",
			includeCredentials: true,
		})
	).body;
}
