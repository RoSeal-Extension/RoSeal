import { signal } from "@preact/signals";
import type { ComponentType } from "preact";
import { AVATAR_EDITOR_FILTERS_INITIAL_VALUE } from "src/ts/components/avatar/constants";
import type { AvatarItemListItem, AvatarItemListsStorageValue } from "src/ts/constants/avatar";
import type { ArchivedItemsItem } from "src/ts/constants/misc";
import {
	addMessageListener,
	invokeMessage,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { getMessagesInject } from "src/ts/helpers/domInvokes";
import { featureValueIsInject, getFeatureValueInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest, hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackCreateElement, hijackState } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import {
	type AvatarColors3s,
	getOutfitById,
	type AvatarAssetDefinitionWithTypes,
	type AvatarBodyColorsLegacy as _AvatarBodyColorsLegacy,
	type AvatarRestrictions,
	type AvatarScales,
	type AvatarType,
	type ListedUserAvatarItem,
} from "src/ts/helpers/requests/services/avatar";
import {
	listUserInventoryAssetsDetailed,
	userOwnsItem,
} from "src/ts/helpers/requests/services/inventory";
import type {
	AvatarItemDetail,
	MarketplaceItemType,
	MultigetAvatarItemsResponse,
} from "src/ts/helpers/requests/services/marketplace";
import { handleArchivedItems } from "src/ts/specials/handleArchivedItems";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { error } from "src/ts/utils/console";
import { onWindowRefocus } from "src/ts/utils/dom";
import {
	filterWornAssets,
	getAssetTypeData,
	insertAssetMetaIntoAssetList,
} from "src/ts/utils/itemTypes";
import { MY_AVATAR_REGEX } from "src/ts/utils/regex";
import { overrideRobloxMessages } from "src/ts/utils/robloxI18n";

export type AvatarBodyColorsLegacy = Record<keyof _AvatarBodyColorsLegacy, string>;

type MenuAvatarInventoryRequest = {
	sortOption: string | number;
	category?: string;
	itemCategories?: unknown[];
	subTypeBlacklist?: number[];
};

type SubcategoryMenu = {
	name: string;
	fullLabel?: string;
	label: string;
	assetType?: string;
	bundleRecommendationType?: boolean;
	avatarInventoryRequest: MenuAvatarInventoryRequest;
};

type CategoryRow = {
	title?: string;
	label?: string;
	tabType?: string;
	name: string;
	subCategoryMenu: SubcategoryMenu[];
	showLayeredClothingSlots?: boolean;
	avatarInventoryRequest: MenuAvatarInventoryRequest;
};

type Category = {
	label: string;
	name: string;
	tabType: string;
	menuType: string;
	categoryRows: CategoryRow[];
	active: boolean;
	avatarInventoryRequest: MenuAvatarInventoryRequest;
};

type AssetType = {
	id: number;
	name?: string;
};

type Thumbnail = {
	Final: boolean;
	Url: string;
};

type ReactItemBase = {
	id: number;
	itemRestrictions?: unknown[];
	name: string;
	thumbnail?: Thumbnail;
	thumbnailType: "Asset" | "Outfit";
	type: "Asset" | "Outfit";
	itemType: "Asset" | "Bundle";
	count?: number;
};

/*
type ReactAssetItem = ReactItemBase & {
	assetType: AssetType;
	itemType: "Asset";
	link: string;
	thumbnailType: "Asset";
	type: "Asset";
	selected?: boolean;
};
*/

type ReactAsset = {
	id: number;
	name: string;
	assetType: AssetType;
	currentVersionId: number;
};

type ReactOutfitItem = ReactItemBase & {
	itemType: "Bundle";
	thumbnailType: "Outfit";
	type: "Outfit";
	link: undefined;
	isEditable?: boolean;
	outfitType: "Avatar" | "DynamicHead";
	assets: ReactAsset[];
	selected?: boolean;
	version?: number;
};

type ReactScales = Record<
	keyof AvatarScales,
	{
		value: number;
	}
>;

export type ReactAvatarEditorPageAvatar = {
	assets: AvatarAssetDefinitionWithTypes[];
	bodyColors: AvatarColors3s;
	scales: ReactScales;
	avatarType: AvatarType;
};

function menuToHash(name: string) {
	return name.replaceAll(" ", "-")?.toLowerCase();
}
function getHashParts() {
	return location.hash.replaceAll("#!/", "").split("/").map(menuToHash);
}

type FilteredItemListComponentProps = {
	type: ComponentType;
	props: {
		items: ReactItemBase[];
	};
	cachedItems: Record<string, AvatarItemDetail<MarketplaceItemType> | undefined>;
	createElement: typeof window.React.createElement;
};

function filteredItemListComponent({
	type,
	props,
	cachedItems,
	createElement,
}: FilteredItemListComponentProps) {
	const [state, setState] = window.React.useState(AVATAR_EDITOR_FILTERS_INITIAL_VALUE);
	window.React.useEffect(() => addMessageListener("avatar.setFilters", setState), []);

	return createElement(type, {
		...props,
		// @ts-expect-error: fine
		items: props.items.filter((item) => {
			const cachedItem = cachedItems[`${item.itemType}${item.id}`];

			return (
				(!state.keyword.length || item.name.toLowerCase().includes(state.keyword)) &&
				(!state.creatorName.length ||
					cachedItem?.creatorName.toLowerCase() === state.creatorName)
			);
		}),
	});
}

export default {
	id: "myAvatar",
	regex: [MY_AVATAR_REGEX],
	fn: () => {
		let menuClick:
			| ((
					a: CategoryRow | Category,
					b?: SubcategoryMenu | CategoryRow,
					c?: SubcategoryMenu | CategoryRow,
			  ) => void)
			| undefined;

		let justChangedTab = false;

		let reactTabs: (Category | CategoryRow)[] | undefined;
		let setReactTabs: ((data: (Category | CategoryRow)[]) => void) | undefined;

		let selectedData:
			| {
					selectedTab?: Category | CategoryRow;
					selectedSubcategory?: SubcategoryMenu;
					selectedCategoryRow?: CategoryRow;
					hoveredTab?: Category | CategoryRow;
			  }
			| undefined;
		let setSelectedData: ((data: typeof selectedData) => void) | undefined;

		setInvokeListener("avatar.getHoveredTabName", () => {
			return selectedData?.hoveredTab?.name;
		});

		const onHashChange = () => {
			if (justChangedTab) {
				justChangedTab = false;
				return;
			}

			const currentHashParts = getHashParts();
			if (currentHashParts.length > 0) {
				const row = reactTabs?.find((tab) => menuToHash(tab.name) === currentHashParts[0]);
				if (row) {
					if (currentHashParts.length > 1) {
						if ("subCategoryMenu" in row) {
							const subMenu =
								row.subCategoryMenu.find(
									(menu) => menuToHash(menu.name) === currentHashParts[1],
								) ?? row.subCategoryMenu[0];

							if (selectedData?.selectedSubcategory?.name !== subMenu.name) {
								if (!selectedData) menuClick?.(row, subMenu);

								if (
									selectedData?.selectedTab?.name !== row.name ||
									selectedData?.selectedSubcategory?.name !== subMenu.name
								)
									setSelectedData?.({
										selectedTab: row,
										selectedSubcategory: subMenu,
										selectedCategoryRow: undefined,
									});
							}
						} else if ("categoryRows" in row) {
							const category = row.categoryRows.find(
								(category) => menuToHash(category.name) === currentHashParts[1],
							);

							if (category) {
								const subcategory = category.subCategoryMenu.find(
									(category) => menuToHash(category.name) === currentHashParts[2],
								);

								if (selectedData?.selectedTab?.name !== category.name) {
									if (!selectedData) menuClick?.(row, subcategory, category);

									if (
										selectedData?.selectedTab?.name !== category.name ||
										selectedData?.selectedSubcategory?.name !==
											subcategory?.name ||
										selectedData?.selectedCategoryRow?.name !== row.name
									)
										setSelectedData?.({
											selectedTab: row,
											selectedSubcategory: subcategory,
											selectedCategoryRow: category,
										});
								}
							} else {
								const category = row.categoryRows[0];

								if (category.name !== selectedData?.selectedTab?.name) {
									if (!selectedData) menuClick?.(row, undefined, category);

									if (
										selectedData?.selectedTab?.name !== row.name ||
										selectedData?.selectedCategoryRow?.name !== category.name
									)
										setSelectedData?.({
											selectedTab: row,
											selectedSubcategory: undefined,
											selectedCategoryRow: category,
										});
								}
							}
						}
					} else {
						if ("subCategoryMenu" in row) {
							if (
								selectedData?.selectedSubcategory?.name !==
								row.subCategoryMenu[0].name
							) {
								if (!selectedData) menuClick?.(row, row.subCategoryMenu[0]);

								if (
									selectedData?.selectedTab?.name !== row.name ||
									selectedData?.selectedSubcategory?.name !==
										row.subCategoryMenu[0].name
								)
									setSelectedData?.({
										selectedTab: row,
										selectedSubcategory: row.subCategoryMenu[0],
										selectedCategoryRow: undefined,
									});
							}
						} else {
							const category = row.categoryRows[0];

							if (category.name !== selectedData?.selectedTab?.name) {
								if (!selectedData) menuClick?.(row, category);

								if (
									selectedData?.selectedCategoryRow?.name !== category.name ||
									selectedData?.selectedSubcategory?.name !==
										category.subCategoryMenu[0].name ||
									selectedData?.selectedTab?.name !== row.name
								)
									setSelectedData?.({
										selectedTab: row,
										selectedSubcategory: undefined,
										selectedCategoryRow: category,
									});
							}
						}
					}
				}
			}
		};

		addMessageListener("avatar.setupArchive", () => {
			const currentArchivedItems = signal<ArchivedItemsItem[]>([]);

			addMessageListener("avatar.setArchivedItems", (data) => {
				currentArchivedItems.value = data;
			});

			handleArchivedItems(currentArchivedItems);
		});

		featureValueIsInject("improvedAvatarBodySection", true, async () => {
			const eyeBrowsType = getAssetTypeData(76);
			const eyeLashesType = getAssetTypeData(77);
			const moodAnimationType = getAssetTypeData(78);
			const dynamicHeadsType = getAssetTypeData(79);

			hijackRequest(async (req) => {
				const url = new URL(req.url);

				if (
					url.hostname === getRobloxUrl("avatar") &&
					url.pathname.match(/^\/v1\/avatar-inventory$/) &&
					url.searchParams.get("sortOption")?.startsWith("rosealAssetType_")
				) {
					const assetTypeIdStr = url.searchParams
						.get("sortOption")
						?.split("rosealAssetType_")?.[1];

					if (!assetTypeIdStr) return;

					const assetTypeId = Number.parseInt(assetTypeIdStr, 10);

					const pageToken = url.searchParams.get("pageToken") ?? undefined;
					const authenticatedUser = await getAuthenticatedUser();
					if (!authenticatedUser) return;

					const data = await listUserInventoryAssetsDetailed({
						userId: authenticatedUser.userId,
						assetTypeId,
						cursor: pageToken,
						limit: 100,
					});

					return new Response(
						JSON.stringify({
							avatarInventoryItems: data.data.map((item) => ({
								itemCategory: {
									itemType: 1,
									itemSubType: assetTypeId,
								},
								itemId: item.assetId,
								itemName: item.assetName,
								availabilityStatus: "Available",
								acquisitionTime: item.created,
							})),
							nextPageToken: data.nextPageCursor,
						}),
						{
							status: 200,
							headers: {
								"content-type": "application/json",
							},
						},
					);
				}
			});

			const [
				eyeBrowsMessage,
				eyeLashesMessage,
				moodAnimationMessage,
				dynamicHeadsMessage,
				bodyMessage,
				bodyPartsMessage,
				classicHeadMessage,
				headMessage,
			] = await getMessagesInject([
				"assetTypes.shortCategory.76",
				"assetTypes.shortCategory.77",
				"assetTypes.shortCategory.78",
				"assetTypes.shortCategory.79",
				"avatar.itemTabs.body",
				"avatar.itemTabs.bodyParts",
				"avatar.itemTabs.classicHead",
				"avatar.itemTabs.head",
			]);

			overrideRobloxMessages("Feature.Avatar", {
				"RoSeal.Eyebrows": eyeBrowsMessage,
				"RoSeal.Eyelashes": eyeLashesMessage,
				"RoSeal.MoodAnimation": moodAnimationMessage,
				"RoSeal.DynamicHeads": dynamicHeadsMessage,
				"RoSeal.Body": bodyMessage,
				"RoSeal.BodyParts": bodyPartsMessage,
				"RoSeal.ClassicHead": classicHeadMessage,
				"RoSeal.Head": headMessage,
			});

			const handleTabs = (tabs: (Category | CategoryRow)[]) => {
				for (let i = 0; i < tabs.length; i++) {
					const tab = tabs[i];
					if (tab.name === "Body" && !("categoryRows" in tab)) {
						let hairAccessory: SubcategoryMenu | undefined;
						let dynamicHeads: SubcategoryMenu | undefined;
						let classicHeads: SubcategoryMenu | undefined;
						let classicFaces: SubcategoryMenu | undefined;
						let leftArms: SubcategoryMenu | undefined;
						let rightArms: SubcategoryMenu | undefined;
						let leftLegs: SubcategoryMenu | undefined;
						let rightLegs: SubcategoryMenu | undefined;
						let torso: SubcategoryMenu | undefined;
						let skinColor: SubcategoryMenu | undefined;
						let scales: SubcategoryMenu | undefined;

						for (const row of tab.subCategoryMenu) {
							if (row.name === "Hair") {
								hairAccessory = row;
							} else if (row.name === "DynamicHeads") {
								row.assetType = "Head"; // fix weird bug
								dynamicHeads = row;
							} else if (row.name === "Head") {
								classicHeads = row;
							} else if (row.name === "Face") {
								classicFaces = row;
							} else if (row.name === "LeftArms") {
								leftArms = row;
							} else if (row.name === "RightArms") {
								rightArms = row;
							} else if (row.name === "LeftLegs") {
								leftLegs = row;
							} else if (row.name === "RightLegs") {
								rightLegs = row;
							} else if (row.name === "BodyColors") {
								row.assetType = "Head"; // fix weird bug
								skinColor = row;
							} else if (row.name === "Scale") {
								row.assetType = "Head"; // fix weird bug
								scales = row;
							} else if (row.name === "Torso") {
								torso = row;
							}
						}

						if (!dynamicHeads) return;

						// @ts-expect-error: Fine
						delete tab.subCategoryMenu;
						// @ts-expect-error: Fine
						tabs[i] = {
							...tab,
							menuType: "Nested",
							categoryRows: [
								{
									title: "RoSeal.Head",
									name: "Head",
									subCategoryMenu: [
										dynamicHeads,
										hairAccessory,
										{
											name: "Eyebrows",
											label: "RoSeal.Eyebrows",
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${eyeBrowsType?.assetTypeId}`,
											},
										},
										{
											name: "Eyelashes",
											label: "RoSeal.Eyelashes",
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${eyeLashesType?.assetTypeId}`,
											},
										},
										{
											name: "MoodAnimation",
											label: "RoSeal.MoodAnimation",
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${moodAnimationType?.assetTypeId}`,
											},
										},
										{
											name: "DynamicHeadsAsset",
											label: "RoSeal.DynamicHeads",
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${dynamicHeadsType?.assetTypeId}`,
											},
										},
									],
								},
								{
									title: "RoSeal.ClassicHead",
									name: "ClassicHead",
									subCategoryMenu: [classicHeads, classicFaces],
								},
								{
									title: "RoSeal.BodyParts",
									name: "BodyParts",
									subCategoryMenu: [
										leftArms,
										rightArms,
										leftLegs,
										rightLegs,
										torso,
									],
								},
								{
									title: "RoSeal.Body",
									name: "Body",
									label: "RoSeal.Body",
									subCategoryMenu: [scales, skinColor],
								},
							],
						};
						break;
					}
				}

				if (selectedData?.selectedTab && !tabs.includes(selectedData.selectedTab)) {
					setSelectedData?.({
						selectedTab: tabs[0]! as CategoryRow,
						selectedCategoryRow: undefined,
						selectedSubcategory: undefined,
					});
				}

				featureValueIsInject("myAvatarHashNav", true, onHashChange);

				return tabs;
			};

			hijackState<typeof reactTabs>({
				matches: (state) => {
					return (
						Array.isArray(state) &&
						state.length > 0 &&
						typeof state[0] === "object" &&
						state[0] !== null &&
						"subCategoryMenu" in state[0]
					);
				},
				setState: ({ value }) => {
					if (Array.isArray(value.current)) {
						handleTabs(value.current);
					}

					return value.current;
				},
			});
		});

		const cachedItems: Record<string, AvatarItemDetail<MarketplaceItemType> | undefined> = {};

		featureValueIsInject("avatarEditorSearch", true, () => {
			hijackResponse((req, res) => {
				if (req.url !== `https://${getRobloxUrl("catalog")}/v1/catalog/items/details`)
					return;

				res?.clone()
					.json()
					.then((data) => {
						for (const item of (
							data as MultigetAvatarItemsResponse<MarketplaceItemType>
						).data) {
							cachedItems[`${item.itemType}${item.id}`] = item;
						}
					});
			});

			hijackCreateElement(
				(_, props) =>
					props !== null &&
					"items" in props &&
					"loading" in props &&
					"getNextPage" in props &&
					"emptyMessage" in props,
				(createElement, type, props) =>
					createElement(filteredItemListComponent, {
						type: type as ComponentType,
						props: props as FilteredItemListComponentProps["props"],
						cachedItems,
						createElement,
					}),
			);
		});

		featureValueIsInject("avatarItemLists", true, async () => {
			const [listsMessage, unsortedMessage, unnamedMessage] = await getMessagesInject([
				"avatar.itemTabs.lists",
				"avatar.itemTabs.unsorted",
				"avatar.itemTabs.unnamed",
			]);

			overrideRobloxMessages("Feature.Avatar", {
				"RoSeal.Lists": listsMessage,
				"RoSeal.Unsorted": unsortedMessage,
				"RoSeal.Unnamed": unnamedMessage,
			});

			let categoryToSet: CategoryRow | Category | undefined;

			let data: AvatarItemListsStorageValue | undefined;

			const handleTabs = (data: typeof reactTabs) => {
				if (!data) return;

				let hasListsTab = false;

				const target = categoryToSet;
				for (let i = 0; i < data.length; i++) {
					const category = data[i];
					if (category.name === "Lists") {
						hasListsTab = true;
						if (!target) {
							data.splice(i, 1);
						} else {
							data[i] = target;
						}
						break;
					}
				}

				if (!hasListsTab && target) {
					data.splice(1, 0, target);
				}
			};

			hijackState<typeof reactTabs>({
				matches: (state) => {
					return (
						Array.isArray(state) &&
						state.length > 0 &&
						typeof state[0] === "object" &&
						state[0] !== null &&
						"subCategoryMenu" in state[0]
					);
				},
				setState: ({ value, publicSetState }) => {
					setReactTabs = publicSetState;
					reactTabs = value.current;

					if (value.current) {
						let hasListsTab = false;

						for (let i = 0; i < value.current.length; i++) {
							const category = value.current[i];
							if (category.name === "Lists") {
								hasListsTab = true;
								if (!categoryToSet) {
									value.current.splice(i, 1);
								} else {
									value.current[i] = categoryToSet;
								}
								break;
							}
						}

						if (!hasListsTab && categoryToSet) {
							value.current.splice(1, 0, categoryToSet);
						}
					}

					return value.current;
				},
			});

			hijackState<typeof selectedData>({
				matches: (state) => {
					return (
						typeof state === "object" &&
						state !== null &&
						"selectedTab" in state &&
						"selectedCategoryRow" in state &&
						"selectedSubcategory" in state
					);
				},
				setState: ({ value, publicSetState }) => {
					if (value.current) selectedData = value.current;
					setSelectedData = publicSetState;

					sendMessage("avatar.hoveredTabNameChanged", value.current?.hoveredTab?.name);

					return value.current;
				},
			});

			addMessageListener("avatar.setItemLists", async (newData) => {
				data = newData;
				if (!newData.lists.length) {
					categoryToSet = undefined;
					if (setReactTabs && reactTabs) {
						handleTabs(reactTabs);
						setReactTabs([...reactTabs]);
					}

					return;
				}

				const categoryObj: Category = {
					active: false,
					label: "RoSeal.Lists",
					name: "Lists",
					tabType: "Assets",
					menuType: "Nested",
					categoryRows: [],
					avatarInventoryRequest: {
						sortOption: "rosealLists_allLists",
					},
				};

				const categoryRowObj: CategoryRow = {
					title: "RoSeal.Lists",
					name: "Lists",
					tabType: "Assets",
					subCategoryMenu: [],
					avatarInventoryRequest: {
						sortOption: "rosealLists_allLists",
					},
				};

				const overrideObj: Record<string, string> = {};

				let shouldUseCategory = false;

				for (const list of newData.lists) {
					const id = list.name ? `RoSeal.Lists.${list.id}` : "RoSeal.Unnamed";
					if (list.name) overrideObj[id] = list.name;

					if (list.type === "Group") {
						shouldUseCategory = true;

						const subCategoryMenus: SubcategoryMenu[] = [];
						for (const item of list.items) {
							const id = `RoSeal.Lists.${item.id}`;
							overrideObj[id] = item.name;

							subCategoryMenus.push({
								label: id,
								name: item.id,
								avatarInventoryRequest: {
									sortOption: `rosealList_${item.id}`,
								},
							});
						}

						categoryObj.categoryRows.push({
							title: list.isDefault ? "RoSeal.Unsorted" : id,
							name: list.id,
							subCategoryMenu: subCategoryMenus,
							avatarInventoryRequest: {
								sortOption: `rosealList_${list.id}`,
							},
						});
					} else {
						categoryRowObj.subCategoryMenu.push({
							label: id,
							name: list.id,
							avatarInventoryRequest: {
								sortOption: `rosealList_${list.id}`,
							},
						});
					}
				}

				if (!shouldUseCategory) {
					categoryRowObj.label = "RoSeal.Lists";
					delete categoryRowObj.title;
				}

				await overrideRobloxMessages("Feature.Avatar", overrideObj);
				categoryToSet = shouldUseCategory ? categoryObj : categoryRowObj;

				if (setReactTabs && reactTabs) {
					handleTabs(reactTabs);
					setReactTabs([...reactTabs]);
					if (selectedData?.selectedTab?.name === "Lists" && setSelectedData) {
						const resetSelectedData = { ...selectedData };
						setSelectedData({});
						setSelectedData?.(resetSelectedData);
					}
				}
			});

			hijackRequest(async (req) => {
				if (!data) return;

				const url = new URL(req.url);

				if (
					url.hostname === getRobloxUrl("avatar") &&
					url.pathname.match(/^\/v1\/avatar-inventory$/) &&
					url.searchParams.get("sortOption")?.startsWith("rosealList_")
				) {
					const listId = url.searchParams.get("sortOption")?.split("rosealList_")?.[1];
					if (!listId) return;

					const isAllLists = listId === "allLists";
					const assetIds: number[] = [];
					const outfitIds: number[] = [];
					const items: AvatarItemListItem[] = [];

					for (const list of data.lists) {
						if (list.type === "List" && (list.id === listId || isAllLists)) {
							for (let i = 0; i < list.items.length; i++) {
								const item = list.items[i];
								items.push(item);

								if (item.type === "Asset") {
									assetIds.push(item.id);
								} else if (item.type === "UserOutfit") {
									outfitIds.push(item.id);
								}
							}
						} else if (list.type === "Group") {
							for (const list2 of list.items) {
								if (list2.id === listId || list.id === listId || isAllLists) {
									for (let i = 0; i < list2.items.length; i++) {
										const item = list2.items[i];
										items.push(item);

										if (item.type === "Asset") {
											assetIds.push(item.id);
										} else if (item.type === "UserOutfit") {
											outfitIds.push(item.id);
										}
									}
								}
							}
						}
					}

					const authenticatedUser = await getAuthenticatedUser();
					if (!authenticatedUser) return;

					const nullDate = new Date(0).toISOString();

					const [ownedAssets, outfitsDetails] = await Promise.all([
						Promise.all(
							assetIds.map((assetId) =>
								userOwnsItem({
									userId: authenticatedUser.userId,
									itemId: assetId,
									itemType: "Asset",
								}).then((data) => ({
									assetId: assetId,
									isOwned: data,
								})),
							),
						),
						Promise.all(
							outfitIds.map((outfitId) =>
								getOutfitById({
									outfitId,
								}).catch(() => {
									error(`Could not fetch details for outfit ID ${outfitId}`);
								}),
							),
						),
					]);

					const formattedItems: ListedUserAvatarItem[] = [];
					for (const item of items) {
						if (item.type === "Asset") {
							const owned = ownedAssets.some(
								(asset) => asset.assetId === item.id && asset.isOwned,
							);
							if (owned) {
								formattedItems.push({
									itemCategory: {
										itemType: 1,
										itemSubType: 0,
									},
									itemId: item.id,
									// hydrated by roblox's frontend
									itemName: " ",
									availabilityStatus: "Available",
									acquisitionTime: nullDate,
								});
							}
						} else if (item.type === "UserOutfit") {
							// NOT hydrated by roblox's frontend.... silly goobers
							const outfit = outfitsDetails.find((item2) => item.id === item2?.id);
							formattedItems.push({
								itemCategory: {
									itemType: 2,
									itemSubType: outfit?.isEditable
										? 3
										: outfit?.inventoryType === "DynamicHead"
											? 2
											: outfit?.inventoryType === "Shoes"
												? 4
												: outfit?.inventoryType === "Animations"
													? 5
													: // purchased avatar
														1,
								},
								itemId: item.id,
								itemName: outfit?.name ?? "",
								availabilityStatus: "Available",
								acquisitionTime: nullDate,
								outfitDetail: outfit
									? {
											playerAvatarType: outfit.playerAvatarType,
											assets: outfit.assets,
											bodyColor3s: outfit.bodyColor3s,
											scales: outfit.scale,
										}
									: undefined,
							});
						}
					}

					return new Response(
						JSON.stringify({
							avatarInventoryItems: formattedItems,
							nextPageToken: null,
						}),
						{
							status: 200,
							headers: {
								"content-type": "application/json",
							},
						},
					);
				}
			});
		});

		featureValueIsInject("myAvatarHashNav", true, () => {
			let isFirstReactRender = true;
			hijackState<typeof selectedData>({
				matches: (state) => {
					return (
						typeof state === "object" &&
						state !== null &&
						"selectedTab" in state &&
						"selectedCategoryRow" in state &&
						"selectedSubcategory" in state
					);
				},
				setState: ({ value, publicSetState, originFromSiteCode }) => {
					setSelectedData = publicSetState;

					if (!originFromSiteCode) {
						selectedData = value.current;
					}

					if (value.current?.selectedTab && originFromSiteCode) {
						const isDifferent =
							selectedData !== undefined &&
							(value.current?.selectedTab?.name !== selectedData?.selectedTab?.name ||
								value.current?.selectedCategoryRow?.name !==
									selectedData?.selectedCategoryRow?.name ||
								value.current?.selectedSubcategory?.name !==
									selectedData?.selectedSubcategory?.name);

						selectedData = value.current;
						if (reactTabs?.length && isFirstReactRender) {
							isFirstReactRender = false;
							onHashChange();
						}

						if (isDifferent) {
							justChangedTab = true;

							const secondPart =
								value.current.selectedCategoryRow?.name ??
								value.current.selectedSubcategory?.name ??
								"";
							let thirdPart = value.current.selectedSubcategory?.name ?? "";
							if (secondPart === thirdPart) {
								thirdPart = "";
							}

							location.hash = `#!/${menuToHash(value.current.selectedTab.name)}/${
								thirdPart
									? `${menuToHash(secondPart)}/${menuToHash(thirdPart)}`
									: menuToHash(secondPart)
							}`;
						}
					}

					return value.current;
				},
			});

			hijackState<typeof reactTabs>({
				matches: (state) => {
					return (
						Array.isArray(state) &&
						state.length > 0 &&
						typeof state[0] === "object" &&
						state[0] !== null &&
						"subCategoryMenu" in state[0]
					);
				},
				setState: ({ value, originFromSetState }) => {
					reactTabs = value.current;

					if (originFromSetState) {
						onHashChange();
					}

					return value.current;
				},
			});

			globalThis.addEventListener("hashchange", onHashChange);
		});

		let prevCreateOutfitDialogOpen = false;
		let refreshOutfits: (() => void) | undefined;

		let prevOutfitToUpdateId: number | undefined;

		let setAvatarCardsLoading: ((loading: boolean) => void) | undefined;

		let avatarRules: AvatarRestrictions | undefined;

		let bodyColors: AvatarColors3s | undefined;
		let setBodyColors: ((colors: AvatarBodyColorsLegacy) => void) | undefined;

		let avatarType: AvatarType | undefined;
		let setAvatarType: ((type: AvatarType) => void) | undefined;

		let currentlyWornAssets: AvatarAssetDefinitionWithTypes[] | undefined;
		let setCurrentlyWornAssets:
			| ((assets: AvatarAssetDefinitionWithTypes[]) => void)
			| undefined;

		let scales: ReactScales | undefined;
		let setScales: ((scales: ReactScales) => void) | undefined;

		// when we update body colors internally but do not want to alert content script (because it already knows...)
		let hasSetBodyColorsManually = false;
		let hasSetupHijack = false;

		const setupReactHijack = async () => {
			if (hasSetupHijack) return;

			hasSetupHijack = true;
			const enableHexColors = await getFeatureValueInject("hexBodyColors");
			onWindowRefocus(10_000, () => {
				hasSetBodyColorsManually = false;
			});

			let lastAssets: string | undefined;
			let lastScales: string | undefined;
			let lastBodyColors: string | undefined;
			let lastAvatarType: AvatarType | undefined;

			const onAvatarUpdate = () => {
				const wornAssetsJSON = JSON.stringify(currentlyWornAssets);
				const scalesJSON = JSON.stringify(scales);
				const bodyColorsJSON = JSON.stringify(bodyColors);

				if (
					(lastAssets !== wornAssetsJSON ||
						lastScales !== scalesJSON ||
						lastBodyColors !== bodyColorsJSON ||
						lastAvatarType !== avatarType) &&
					currentlyWornAssets &&
					scales &&
					bodyColors &&
					avatarType
				) {
					lastAssets = wornAssetsJSON;
					lastScales = scalesJSON;
					lastBodyColors = bodyColorsJSON;
					lastAvatarType = avatarType;

					sendMessage("avatar.avatarUpdated", {
						assets: currentlyWornAssets,
						scales,
						bodyColors,
						avatarType,
					});
				}
			};
			addMessageListener("avatar.updateAssets", (data) => setCurrentlyWornAssets?.(data));
			addMessageListener("avatar.refreshCharacters", () => refreshOutfits?.());
			addMessageListener("avatar.updateBodyColors", (data) => {
				bodyColors = data;

				hasSetBodyColorsManually = true;
				setBodyColors?.({
					headColorId: data.headColor3,
					torsoColorId: data.torsoColor3,
					leftArmColorId: data.leftArmColor3,
					rightArmColorId: data.rightArmColor3,
					leftLegColorId: data.leftLegColor3,
					rightLegColorId: data.rightLegColor3,
				});
			});

			hijackState<AvatarBodyColorsLegacy>({
				matches: (state) =>
					typeof state === "object" && state !== null && "headColorId" in state,
				setState: ({ value, originFromSetState, publicSetState }) => {
					setBodyColors = publicSetState;

					if (originFromSetState) {
						if (!hasSetBodyColorsManually) {
							const colors = value.current;

							const data = {
								headColor3: colors.headColorId,
								torsoColor3: colors.torsoColorId,
								leftArmColor3: colors.leftArmColorId,
								rightArmColor3: colors.rightArmColorId,
								leftLegColor3: colors.leftArmColorId,
								rightLegColor3: colors.rightLegColorId,
							};

							bodyColors = data;
							sendMessage("avatar.bodyColorsChanged", data);
						}

						onAvatarUpdate();
					}

					return value.current;
				},
			});

			hijackState<ReactScales>({
				matches: (state) =>
					typeof state === "object" &&
					state !== null &&
					"head" in state &&
					typeof state.head === "object" &&
					state.head !== null &&
					"value" in state.head &&
					"increment" in state.head,
				setState: ({ value, publicSetState, originFromSetState }) => {
					setScales = publicSetState;
					scales = value.current;

					if (originFromSetState) {
						onAvatarUpdate();
					}

					return value.current;
				},
			});

			hijackCreateElement(
				(_, props) =>
					props !== null &&
					typeof props === "object" &&
					(("refreshOutfits" in props && "open" in props && "closeDialog" in props) ||
						("outfit" in props &&
							"handleClose" in props &&
							"updateOutfitInDataList" in props) ||
						("onItemClicked" in props && "isItemSelected" in props) ||
						("value" in props &&
							typeof props.value === "object" &&
							props.value !== null &&
							(("avatarCallLimiterItemCardsDisabled" in props.value &&
								"setAvatarCallLimiterItemCardsDisabled" in props.value) ||
								"setCurrentlyWornAssets" in props.value ||
								"setAvatarType" in props.value ||
								"avatarRules" in props.value))),
				(_, __, props) => {
					const propsType = props as
						| {
								refreshOutfits: () => void;
								open: boolean;
								closeDialog: () => void;
						  }
						| {
								outfit: ReactOutfitItem | undefined;
								handleClose: () => void;
								updateOutfitInDataList: (data: ReactOutfitItem) => void;
						  }
						| {
								onItemClicked: (item: ReactOutfitItem) => void;
								isItemSelected: boolean;
								translate: (key: string) => string;
						  }
						| {
								value: {
									avatarType: AvatarType;
									setAvatarType: (type: AvatarType) => void;
									avatarRules?: AvatarRestrictions;
								};
						  }
						| {
								value: {
									currentlyWornAssetsList: AvatarAssetDefinitionWithTypes[];
									setCurrentlyWornAssets: (
										assets: AvatarAssetDefinitionWithTypes[],
									) => void;
								};
						  }
						| {
								value: {
									avatarCallLimiterItemCardsDisabled: boolean;
									setAvatarCallLimiterItemCardsDisabled: (
										loading: boolean,
									) => void;
								};
						  };

					if ("outfit" in propsType) {
						if (!enableHexColors) return;
						if (propsType.outfit?.id !== prevOutfitToUpdateId) {
							prevOutfitToUpdateId = propsType.outfit?.id;

							if (prevOutfitToUpdateId) {
								propsType.handleClose();
								sendMessage("avatar.updateCharacter", {
									characterId: prevOutfitToUpdateId,
								});
							}
						}

						return null;
					}

					if ("refreshOutfits" in propsType) {
						if (!enableHexColors) return;
						if (propsType.open !== prevCreateOutfitDialogOpen) {
							prevCreateOutfitDialogOpen = propsType.open;
							if (prevCreateOutfitDialogOpen) {
								sendMessage("avatar.createCharacter", undefined);
								propsType.closeDialog();
							}
						}
						refreshOutfits = propsType.refreshOutfits;

						return null;
					}

					if ("onItemClicked" in propsType) {
						if (!enableHexColors) return;

						hijackFunction(
							propsType,
							(target, thisArg, args) => {
								const item = args[0];
								if (item.type === "Outfit" && item.isEditable) {
									setAvatarCardsLoading?.(true);
									invokeMessage("avatar.wearCharacter", {
										characterId: item.id,
									}).then((data) => {
										setAvatarType?.(data.playerAvatarType);
										setCurrentlyWornAssets?.(data.assets);

										if (scales) {
											const newScales = { ...scales };
											for (const key in newScales) {
												newScales[key as keyof typeof newScales].value =
													data.scale[key as keyof typeof data.scale] *
													100;
											}

											setScales?.(newScales);
										}

										hasSetBodyColorsManually = true;
										setBodyColors?.({
											headColorId: data.bodyColor3s.headColor3,
											torsoColorId: data.bodyColor3s.torsoColor3,
											leftArmColorId: data.bodyColor3s.leftArmColor3,
											rightArmColorId: data.bodyColor3s.rightArmColor3,
											leftLegColorId: data.bodyColor3s.leftLegColor3,
											rightLegColorId: data.bodyColor3s.rightLegColor3,
										});
										setAvatarCardsLoading?.(false);
									});

									return;
								}

								return target.apply(thisArg, args);
							},
							"onItemClicked",
						);
					} else if ("value" in propsType) {
						if ("avatarCallLimiterItemCardsDisabled" in propsType.value) {
							setAvatarCardsLoading =
								propsType.value.setAvatarCallLimiterItemCardsDisabled;
						} else if ("setCurrentlyWornAssets" in propsType.value) {
							currentlyWornAssets = propsType.value.currentlyWornAssetsList;
							setCurrentlyWornAssets = propsType.value.setCurrentlyWornAssets;
						} else if ("setAvatarType" in propsType.value) {
							avatarType = propsType.value.avatarType;
							setAvatarType = propsType.value.setAvatarType;
							if (!avatarRules && propsType.value.avatarRules) {
								sendMessage("avatar.setAvatarRules", propsType.value.avatarRules);
							}
							avatarRules = propsType.value.avatarRules;
						}
					}

					onAvatarUpdate();
				},
			);
		};

		featureValueIsInject("advancedAvatarCustomization", true, setupReactHijack);
		featureValueIsInject("hexBodyColors", true, setupReactHijack);
		featureValueIsInject("avatarEditorPostAvatar", true, setupReactHijack);
		featureValueIsInject("avatarEditorCurrentlyWearing", true, setupReactHijack);

		featureValueIsInject("avatarUnlockedAccessoryLimits", true, () => {
			onSet(window, "Roblox")
				.then((roblox) => onSet(roblox, "AvatarAccoutrementService"))
				.then((service) => {
					hijackFunction(
						service,
						(target, thisArg, args) => {
							return filterWornAssets(
								[args[0], ...args[1]],
								true,
								target.apply(thisArg, args),
							).assets;
						},
						"addAssetToAvatar",
					);

					hijackFunction(
						service,
						(_, __, args) => {
							return insertAssetMetaIntoAssetList(...args);
						},
						"insertAssetMetaIntoAssetList",
					);
				});
		});
	},
} satisfies Page;
