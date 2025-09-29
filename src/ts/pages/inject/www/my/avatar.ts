import { signal } from "@preact/signals";
import type { AvatarItemListItem, AvatarItemListsStorageValue } from "src/ts/constants/avatar";
import type { ArchivedItemsItem } from "src/ts/constants/misc";
import {
	addMessageListener,
	invokeMessage,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { getMessagesInject } from "src/ts/helpers/domInvokes";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import { hijackCreateElement, hijackState } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import {
	getOutfitById,
	type AvatarAssetDefinitionWithTypes,
	type AvatarBodyColorsLegacy,
	type AvatarRestrictions,
	type AvatarScales,
	type AvatarType,
	type ListedUserAvatarItem,
} from "src/ts/helpers/requests/services/avatar";
import {
	listUserInventoryAssetsDetailed,
	userOwnsItem,
} from "src/ts/helpers/requests/services/inventory";
import { handleArchivedItems } from "src/ts/specials/handleArchivedItems";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getClosestHexColor, normalizeColor } from "src/ts/utils/colors";
import { onWindowRefocus } from "src/ts/utils/dom";
import {
	filterWornAssets,
	getAssetTypeData,
	insertAssetMetaIntoAssetList,
} from "src/ts/utils/itemTypes";
import { MY_AVATAR_REGEX } from "src/ts/utils/regex";
import { overrideRobloxMessages } from "src/ts/utils/robloxI18n";
import tinycolor from "tinycolor2";

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

function menuToHash(name: string) {
	return name.replaceAll(" ", "-")?.toLowerCase();
}
function getHashParts() {
	return location.hash.replaceAll("#!/", "").split("/").map(menuToHash);
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

			const handleTabs = (tabs: (Category | CategoryRow)[], isReact: boolean) => {
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
								if (isReact) row.assetType = "Head"; // fix weird bug
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
								if (isReact) row.assetType = "Head"; // fix weird bug
								skinColor = row;
							} else if (row.name === "Scale") {
								if (isReact) row.assetType = "Head"; // fix weird bug
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
									title: isReact ? "RoSeal.Head" : headMessage,
									name: "Head",
									subCategoryMenu: [
										dynamicHeads,
										hairAccessory,
										{
											name: "Eyebrows",
											label: isReact ? "RoSeal.Eyebrows" : eyeBrowsMessage,
											assetType: eyeBrowsType?.alternativeTypes?.[0],
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${eyeBrowsType?.assetTypeId}`,
											},
										},
										{
											name: "Eyelashes",
											label: isReact ? "RoSeal.Eyelashes" : eyeLashesMessage,
											assetType: eyeLashesType?.alternativeTypes?.[0],
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${eyeLashesType?.assetTypeId}`,
											},
										},
										{
											name: "MoodAnimation",
											label: isReact
												? "RoSeal.MoodAnimation"
												: moodAnimationMessage,
											assetType: moodAnimationType?.alternativeTypes?.[0],
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${moodAnimationType?.assetTypeId}`,
											},
										},
										{
											name: "DynamicHeadsAsset",
											label: isReact
												? "RoSeal.DynamicHeads"
												: dynamicHeadsMessage,
											assetType: dynamicHeadsType?.alternativeTypes?.[0],
											avatarInventoryRequest: {
												sortOption: `rosealAssetType_${dynamicHeadsType?.assetTypeId}`,
											},
										},
									],
								},
								{
									title: isReact ? "RoSeal.ClassicHead" : classicHeadMessage,
									name: "ClassicHead",
									subCategoryMenu: [classicHeads, classicFaces],
								},
								{
									title: isReact ? "RoSeal.BodyParts" : bodyPartsMessage,
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
									title: isReact ? "RoSeal.Body" : bodyMessage,
									name: "Body",
									label: isReact ? "RoSeal.Body" : bodyMessage,
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
						handleTabs(value.current, true);
					}

					return value.current;
				},
			});
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
			let angularCategoryToSet: CategoryRow | Category | undefined;

			let data: AvatarItemListsStorageValue | undefined;

			const handleTabs = (data: typeof reactTabs, isReact = true) => {
				if (!data) return;

				let hasListsTab = false;

				const target = isReact ? categoryToSet : angularCategoryToSet;
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
								assetType: "Shirt",
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
							assetType: "Shirt",
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
									acquisitionTime: nullDate,
								});
							}
						} else if (item.type === "UserOutfit") {
							// NOT hydrated by roblox's frontend.... silly goobers
							const outfit = outfitsDetails.find((item2) => item.id === item2.id);
							formattedItems.push({
								itemCategory: {
									itemType: 2,
									itemSubType: 0,
								},
								itemId: item.id,
								itemName: outfit?.name ?? "",
								acquisitionTime: nullDate,
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

		featureValueIsInject("hexBodyColors", true, () => {
			let prevCreateOutfitDialogOpen = false;
			let refreshOutfits: (() => void) | undefined;

			let prevOutfitToUpdateId: number | undefined;

			let setAvatarCardsLoading: ((loading: boolean) => void) | undefined;

			let avatarRules: AvatarRestrictions | undefined;

			let setBodyColors: ((colors: AvatarBodyColorsLegacy) => void) | undefined;
			let setAvatarType: ((type: AvatarType) => void) | undefined;
			let setCurrentlyWornAssets:
				| ((assets: AvatarAssetDefinitionWithTypes[]) => void)
				| undefined;

			let scales: ReactScales | undefined;
			let setScales: ((scales: ReactScales) => void) | undefined;

			const getColors = () =>
				avatarRules?.bodyColorsPalette.map((color) => ({
					rgb: tinycolor(color.hexColor).toRgb(),
					...color,
				})) ?? [];
			const getHexFromColorId = (colorId: number) => {
				const color = avatarRules?.bodyColorsPalette.find(
					(color) => color.brickColorId === colorId,
				);

				return normalizeColor(color?.hexColor ?? "000000", true);
			};

			addMessageListener("avatar.updateAssets", (data) => setCurrentlyWornAssets?.(data));
			addMessageListener("avatar.refreshCharacters", () => refreshOutfits?.());
			addMessageListener("avatar.updateBodyColors", (data) => {
				const colors = getColors();

				oneCallBodyColors = true;
				setBodyColors?.({
					headColorId: getClosestHexColor(colors, data.headColor3).brickColorId,
					torsoColorId: getClosestHexColor(colors, data.torsoColor3).brickColorId,
					leftArmColorId: getClosestHexColor(colors, data.leftArmColor3).brickColorId,
					rightArmColorId: getClosestHexColor(colors, data.rightArmColor3).brickColorId,
					leftLegColorId: getClosestHexColor(colors, data.leftLegColor3).brickColorId,
					rightLegColorId: getClosestHexColor(colors, data.rightLegColor3).brickColorId,
				});
			});

			let oneCallBodyColors = false;
			onWindowRefocus(10_000, () => {
				oneCallBodyColors = false;
			});
			hijackState<AvatarBodyColorsLegacy>({
				matches: (state) =>
					typeof state === "object" && state !== null && "headColorId" in state,
				setState: ({ value, originFromSetState, publicSetState }) => {
					setBodyColors = publicSetState;

					if (originFromSetState) {
						if (oneCallBodyColors) {
							const colors = value.current;

							sendMessage("avatar.bodyColorsChanged", {
								headColor3: normalizeColor(getHexFromColorId(colors.headColorId)),
								leftArmColor3: normalizeColor(
									getHexFromColorId(colors.leftArmColorId),
								),
								rightArmColor3: normalizeColor(
									getHexFromColorId(colors.rightArmColorId),
								),
								leftLegColor3: normalizeColor(
									getHexFromColorId(colors.leftLegColorId),
								),
								rightLegColor3: normalizeColor(
									getHexFromColorId(colors.rightLegColorId),
								),
								torsoColor3: normalizeColor(getHexFromColorId(colors.torsoColorId)),
							});
						} else {
							oneCallBodyColors = true;
						}
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
				setState: ({ value, publicSetState }) => {
					setScales = publicSetState;
					scales = value.current;

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
									setAvatarType: (type: AvatarType) => void;
									avatarRules?: AvatarRestrictions;
								};
						  }
						| {
								value: {
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
						hijackFunction(
							propsType,
							(target, thisArg, args) => {
								const item = args[0];
								if (item.type === "Outfit" && item.isEditable) {
									setAvatarCardsLoading?.(true);
									invokeMessage("avatar.wearCharacter", {
										characterId: item.id,
									}).then((data) => {
										const colors = getColors();
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

										oneCallBodyColors = true;
										setBodyColors?.({
											headColorId: getClosestHexColor(
												colors,
												data.bodyColor3s.headColor3,
											).brickColorId,
											leftArmColorId: getClosestHexColor(
												colors,
												data.bodyColor3s.leftArmColor3,
											).brickColorId,
											rightArmColorId: getClosestHexColor(
												colors,
												data.bodyColor3s.rightArmColor3,
											).brickColorId,
											leftLegColorId: getClosestHexColor(
												colors,
												data.bodyColor3s.leftLegColor3,
											).brickColorId,
											rightLegColorId: getClosestHexColor(
												colors,
												data.bodyColor3s.rightLegColor3,
											).brickColorId,
											torsoColorId: getClosestHexColor(
												colors,
												data.bodyColor3s.torsoColor3,
											).brickColorId,
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
							setCurrentlyWornAssets = propsType.value.setCurrentlyWornAssets;
						} else if ("setAvatarType" in propsType.value) {
							setAvatarType = propsType.value.setAvatarType;
							avatarRules = propsType.value.avatarRules;
						}
					}
				},
			);
		});

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
