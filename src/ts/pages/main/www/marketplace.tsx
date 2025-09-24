import { effect, signal } from "@preact/signals";
import ColorThief from "colorthief";
import { render } from "preact";
import MarketplaceColorFiltersNew from "src/ts/components/marketplace/filters/Colors";
import MarketplaceCreatorTypeFilterNew from "src/ts/components/marketplace/filters/CreatorTypes";
import MarketplaceOwnedItemsFilterNew from "src/ts/components/marketplace/filters/OwnedItems";
import LooksSearchContainer from "src/ts/components/marketplace/LooksSearchContainer";
import MarketplaceLanding from "src/ts/components/marketplace/widgets/Landing";
import {
	type AgentIncludingAll,
	DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE,
	type MarketplaceColorFiltersState,
} from "src/ts/constants/marketplace";
import { addMessageListener } from "src/ts/helpers/communication/dom";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { hideEl, showEl, watch, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { abbreviateNumber } from "src/ts/helpers/i18n/intlFormats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import type {
	AvatarItemDetail,
	MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { compareColor, hexToRgb, rgbToHex } from "src/ts/utils/colors";
import { onElementLoad } from "src/ts/utils/dom";
import { AVATAR_ITEM_REGEX, AVATAR_MARKETPLACE_REGEX } from "src/ts/utils/regex";
import { renderAppend, renderBefore, renderIn } from "src/ts/utils/render";
import { getPathFromMaybeUrl } from "src/ts/utils/url";

export default {
	id: "marketplace",
	regex: [AVATAR_MARKETPLACE_REGEX],
	css: ["css/marketplace.css"],
	hotSwappable: true,
	fn: () => {
		const checks: MaybeDeepPromise<(() => void | undefined | boolean) | undefined | void>[] =
			[];

		checks.push(
			featureValueIs("marketplaceLandingParity", true, () =>
				watchOnce("#main-view").then((view) => {
					const el = renderBefore(<MarketplaceLanding />, view);

					if (el) return () => render(null, el);
				}),
			),
		);

		checks.push(
			featureValueIs("marketplaceSearchLooks", true, () => {
				const searchKeyword = signal("");

				const parseUrl = () => {
					const searchParams = new URLSearchParams(window.location.search);
					searchKeyword.value = searchParams.get("Keyword") ?? "";
				};

				parseUrl();

				let currentUrl = window.location.href;
				const checkUrl = setInterval(() => {
					if (window.location.href === currentUrl) return;

					currentUrl = window.location.href;
					parseUrl();
				}, 500);

				checks.push(() => {
					clearInterval(checkUrl);
				});

				return watch("#main-view #results .organic-items-wrapper", (wrapper) => {
					renderAppend(<LooksSearchContainer searchKeyword={searchKeyword} />, wrapper);
				});
			}),
		);

		checks.push(
			featureValueIs("marketplaceShowQuantityRemaining", true, () => {
				const items = signal<Record<string, AvatarItemDetail<MarketplaceItemType>>>({});

				checks.push(
					watch<HTMLAnchorElement>("#main-view .item-card-link", (el) => {
						const link = el?.href;

						if (!link) return;
						const path = getPathFromMaybeUrl(link).realPath;
						const match = AVATAR_ITEM_REGEX.exec(path);

						const itemType = match?.[1] === "bundles" ? "Bundle" : "Asset";
						const idStr = match?.[2];
						if (itemType && idStr) {
							const id = Number.parseInt(idStr, 10);

							const data = items.value[`${itemType}/${id}`];
							if (!data || !data.totalQuantity || !data.unitsAvailableForConsumption)
								return;

							const imgContainer =
								el.querySelector<HTMLElement>(".thumbnail-2d-container");
							if (!imgContainer) return;
							renderBefore(
								<span className="quantity-remaining-text">
									{getMessage("marketplace.item.quantityLeft", {
										quantityLeft: abbreviateNumber(
											data.unitsAvailableForConsumption,
											99_999,
										),
										totalQuantity: abbreviateNumber(data.totalQuantity, 99_999),
									})}
								</span>,
								imgContainer,
							);
						}
					}),
				);

				return addMessageListener("marketplace.sendItems", (data) => {
					for (const item of data) {
						items.value[`${item.itemType}/${item.id}`] = item;
					}

					items.value = {
						...items.value,
					};
				});
			}),
		);

		checks.push(
			featureValueIs("fixMarketplaceOffSaleFilter", true, () =>
				getLangNamespace("Feature.Catalog").then((namespace) => {
					const label = namespace["Label.OffSale"];
					return watch(
						"item-card-price .text-label, .thumbnail-price .text-label",
						(el) => {
							if (
								document.querySelector("#radio-unavailable-show:checked") ||
								location.search.match(/includenotforsale/i) ||
								el.textContent !== label
							) {
								return;
							}

							const parent = el.closest<HTMLElement>(
								".list-item, .catalog-item-container",
							);
							if (parent) hideEl(parent, undefined, "data-item-not-offsale");
						},
					);
				}),
			),
		);

		checks.push(
			featureValueIs("clientMarketplaceColorFilters", true, () => {
				const colorThief = new ColorThief();
				const state = signal<MarketplaceColorFiltersState>(
					DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE,
				);

				const parseUrl = () => {
					const params = new URLSearchParams(window.location.search);

					const primaryBaseColor = params.get("PrimaryBaseColor");
					const secondaryBaseColor = params.get("SecondaryBaseColor");
					const anyBaseColor = params.get("AnyBaseColor");

					state.value = {
						primaryBaseColor: primaryBaseColor ? hexToRgb(primaryBaseColor) : [0, 0, 0],
						primaryBaseColorEnabled: primaryBaseColor !== null,
						secondaryBaseColor: secondaryBaseColor
							? hexToRgb(secondaryBaseColor)
							: [0, 0, 0],
						secondaryBaseColorEnabled: secondaryBaseColor !== null,
						anyBaseColor: anyBaseColor ? hexToRgb(anyBaseColor) : [0, 0, 0],
						anyBaseColorEnabled: anyBaseColor !== null,
					};
				};

				parseUrl();
				globalThis.addEventListener("popstate", parseUrl);
				checks.push(() => {
					globalThis.removeEventListener("popstate", parseUrl);
				});

				const imageCache = new Map<string, [number, number, number][]>();

				const onImgLoad = (img: HTMLImageElement, card: HTMLLIElement) => {
					let imgColor: [number, number, number][] | undefined;
					if (imageCache.has(img.src)) {
						imgColor = imageCache.get(img.src)!;
					} else {
						imgColor = colorThief.getPalette(img) || [];
						if (imgColor) {
							imageCache.set(img.src, imgColor);
						}
					}

					if (!imgColor) return;
					const [primaryColor, secondaryColor] = imgColor;

					if (
						(!state.value.primaryBaseColorEnabled ||
							state.value.primaryBaseColor.every((color, index) =>
								compareColor(color, primaryColor[index]),
							)) &&
						(!state.value.secondaryBaseColorEnabled ||
							state.value.secondaryBaseColor.every((color, index) =>
								compareColor(color, secondaryColor[index]),
							)) &&
						(!state.value.anyBaseColorEnabled ||
							imgColor.some((color) =>
								color.every((color, index) =>
									compareColor(color, state.value.anyBaseColor[index]),
								),
							))
					) {
						showEl(card, "data-item-not-color-matched");
					}
				};

				const handleImg = (img: HTMLImageElement) => {
					const card = img.closest<HTMLLIElement>(".list-item, .catalog-item-container");
					if (!card) return;

					if (
						state.value.anyBaseColorEnabled ||
						state.value.primaryBaseColorEnabled ||
						state.value.secondaryBaseColorEnabled
					) {
						hideEl(card, undefined, "data-item-not-color-matched");
					}

					img.crossOrigin = "anonymous";

					onElementLoad(img).then(() => onImgLoad(img, card));
				};

				checks.push(
					watch<HTMLImageElement>(
						"#results .list-item .item-card-link img[src], #results .catalog-item-container .item-card-link img[src]",
						handleImg,
					),
				);

				checks.push(
					watch(".catalog-results #results .list-item", (link) => {
						if (link.querySelector("img")) return;

						if (
							state.value.anyBaseColorEnabled ||
							state.value.primaryBaseColorEnabled ||
							state.value.secondaryBaseColorEnabled
						) {
							hideEl(link, undefined, "data-item-not-color-matched");
						}
					}),
				);

				state.subscribe((value) => {
					const url = new URL(window.location.href);
					if (value.primaryBaseColorEnabled) {
						url.searchParams.set("PrimaryBaseColor", rgbToHex(value.primaryBaseColor));
					} else {
						url.searchParams.delete("PrimaryBaseColor");
					}
					if (value.secondaryBaseColorEnabled) {
						url.searchParams.set(
							"SecondaryBaseColor",
							rgbToHex(value.secondaryBaseColor),
						);
					} else {
						url.searchParams.delete("SecondaryBaseColor");
					}
					if (value.anyBaseColorEnabled) {
						url.searchParams.set("AnyBaseColor", rgbToHex(value.anyBaseColor));
					} else {
						url.searchParams.delete("AnyBaseColor");
					}

					const newUrl = url.toString();
					if (newUrl !== window.location.href) {
						window.history.pushState(null, "", newUrl);
					}

					for (const item of document.querySelectorAll<HTMLImageElement>(
						"#results .list-item .item-card-link img[src], #results .catalog-item-container .item-card-link img[src]",
					)) {
						handleImg(item);
					}
				});

				checks.push(
					watch(".catalog-revamp .catalog-search-options-top-bar", (topBar) => {
						const colorFilters = topBar.querySelector(".marketplace-color-filters-new");
						if (colorFilters) {
							return;
						}

						renderIn(<MarketplaceColorFiltersNew state={state} />, topBar);
					}),
				);
			}),
		);

		checks.push(
			featureValueIs("marketplaceOwnedFilter", true, async () => {
				const hideOwnedItems = signal(false);
				const userId = (await getAuthenticatedUser())?.userId;
				if (!userId) return;

				const handleItem = (link: HTMLAnchorElement) => {
					const card = link.closest<HTMLLIElement>(".list-item, .catalog-item-container");
					if (!card) return;
					if (!hideOwnedItems.value) {
						showEl(card, "data-item-not-unowned");

						return;
					}

					if (!link.href) return;

					const path = getPathFromMaybeUrl(link.href).realPath;
					const match = AVATAR_ITEM_REGEX.exec(path);

					if (!match) return;

					const itemType = match[1] === "bundles" ? "Bundle" : "Asset";
					const itemId = Number.parseInt(match[2], 10);

					hideEl(card, undefined, "data-item-not-unowned");
					userOwnsItem({
						userId,
						itemType,
						itemId,
					}).then((ownsItem) => {
						if (!hideOwnedItems.value) {
							return;
						}

						if (ownsItem) {
							hideEl(card, undefined, "data-item-not-unowned");
						} else {
							showEl(card, "data-item-not-unowned");
						}
					});
				};

				const setHideOwnedItems = (hide: boolean) => {
					hideOwnedItems.value = hide;

					const url = new URL(window.location.href);
					if (hide) {
						url.searchParams.set("HideOwnedItems", "");
					} else {
						url.searchParams.delete("HideOwnedItems");
					}
					const newUrl = url.toString();
					if (newUrl !== window.location.href) {
						window.history.pushState(null, "", newUrl);
					}

					for (const item of document.querySelectorAll<HTMLAnchorElement>(
						".catalog-results #results .list-item .item-card-link, .catalog-revamp .item-card-link",
					)) {
						handleItem(item);
					}
				};

				const parseUrl = () => {
					const url = new URL(window.location.href);
					setHideOwnedItems(url.searchParams.has("HideOwnedItems"));
				};

				parseUrl();
				globalThis.addEventListener("popstate", parseUrl);
				checks.push(() => {
					globalThis.removeEventListener("popstate", parseUrl);
				});

				checks.push(
					watch(
						".catalog-results #results .list-item .item-card-link, .catalog-revamp .item-card-link",
						handleItem,
					),
				);

				checks.push(
					watch(".catalog-revamp .catalog-search-options-top-bar", (topBar) => {
						const hideFilter = topBar.querySelector(
							".marketplace-owned-items-filter-new",
						);
						if (hideFilter) {
							return;
						}

						renderIn(
							<MarketplaceOwnedItemsFilterNew
								state={hideOwnedItems}
								updateState={setHideOwnedItems}
							/>,
							topBar,
						);
					}),
				);
			}),
		);

		checks.push(
			featureValueIs("marketplaceCreatorTypeFilter", true, () => {
				const creatorType = signal<AgentIncludingAll>("All");
				const setCreatorType = (
					type: AgentIncludingAll,
					fromUpdate?: boolean,
					noRefresh?: boolean,
					name?: string,
				) => {
					creatorType.value = type;

					if (fromUpdate) {
						return;
					}

					const url = new URL(window.location.href);

					url.searchParams.set("CreatorType", type);
					if (name) url.searchParams.set("CreatorName", name);
					const newUrl = url.toString();
					if (newUrl !== window.location.href) {
						window.history.pushState(null, "", newUrl);
						if (!noRefresh) {
							globalThis.dispatchEvent(new CustomEvent("popstate"));
						}
					}
				};

				const parseUrl = () => {
					const url = new URL(window.location.href);
					const type = url.searchParams.get("CreatorType");

					setCreatorType((type || "All") as AgentIncludingAll, true);
				};

				globalThis.addEventListener("popstate", parseUrl);
				checks.push(() => {
					globalThis.removeEventListener("popstate", parseUrl);
				});
				parseUrl();

				checks.push(
					getLangNamespace("Feature.Catalog").then((data) => {
						const creatorNameText = data["Label.CreatorName"];
						return watch(".catalog-search-options-top-bar label", (label) => {
							if (label.textContent !== creatorNameText) {
								return;
							}

							const group = label.closest<HTMLElement>(".filter-option");
							if (!group) {
								return;
							}

							const cachedCreatorType = signal(creatorType.value);
							effect(() => {
								if (cachedCreatorType.peek() === creatorType.value) {
									return;
								}

								cachedCreatorType.value = creatorType.value;
							});

							const modal = group.closest(".filters-modal-container");
							const btn = modal?.querySelector(".apply-button");
							const input = modal?.querySelector<HTMLInputElement>("input");

							if (!btn || !input) {
								return;
							}

							btn.addEventListener(
								"click",
								() => {
									modal?.querySelector<HTMLElement>(".icon-close")?.click();

									setCreatorType(
										cachedCreatorType.value,
										undefined,
										undefined,
										input.value,
									);
								},
								{ capture: true },
							);

							if (group.querySelector(".marketplace-creator-type-filter-new")) {
								return;
							}
							renderIn(
								<MarketplaceCreatorTypeFilterNew
									state={cachedCreatorType}
									updateState={(data) => {
										cachedCreatorType.value = data;
										btn.removeAttribute("disabled");
									}}
								/>,
								group,
							);
						});
					}),
				);
			}),
		);
	},
} satisfies Page;
