import { effect, signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import AdvancedCustomizationButton from "src/ts/components/avatar/AdvancedCustomizationButton";
import { AVATAR_EDITOR_FILTERS_INITIAL_VALUE } from "src/ts/components/avatar/constants";
import AvatarEditorCurrentlyWearing from "src/ts/components/avatar/CurrentlyWearing";
import EditItemListsButton from "src/ts/components/avatar/EditItemListsButton";
import AvatarEditorSearch from "src/ts/components/avatar/filters/AvatarEditorSearch";
import CreateCharacterModal from "src/ts/components/avatar/modals/CreateCharacterModal";
import EditItemListsModal from "src/ts/components/avatar/modals/EditItemListsModal";
import UpdateCharacterModal from "src/ts/components/avatar/modals/UpdateCharacterModal";
import PostAvatarButton from "src/ts/components/avatar/PostAvatar";
import SetBodyColor from "src/ts/components/avatar/SetBodyColor";
import SetBodyColors from "src/ts/components/avatar/SetBodyColors";
import AddToAvatarListButton from "src/ts/components/avatarItem/lists/AddToListButton";
import CheckboxField from "src/ts/components/core/CheckboxField";
import { warning } from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback";
import storageSignal from "src/ts/components/hooks/storageSignal";
import {
	AVATAR_ITEM_LISTS_STORAGE_KEY,
	type AvatarItemListItemType,
	type AvatarItemListsStorageValue,
	BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY,
} from "src/ts/constants/avatar";
import { ARCHIVED_ITEMS_STORAGE_KEY, type ArchivedItemsStorageValue } from "src/ts/constants/misc";
import {
	addMessageListener,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { watch, watchAttributes, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	type AvatarColors3s,
	getAuthenticatedUserAvatar,
	getOutfitById,
	setAvatarType,
	setBodyColors,
	setScales,
	setWearingAssets,
} from "src/ts/helpers/requests/services/avatar";
import {
	getLocalStorage,
	onStorageValueUpdate,
	setLocalStorage,
	storage,
} from "src/ts/helpers/storage";
import { onWindowRefocus } from "src/ts/utils/dom";
import { sleep } from "src/ts/utils/misc";
import { AVATAR_ITEM_REGEX, MY_AVATAR_REGEX } from "src/ts/utils/regex";
import { renderAfter, renderAppend, renderAppendBody } from "src/ts/utils/render";

export default {
	id: "myAvatar",
	regex: [MY_AVATAR_REGEX],
	css: ["css/avatar.css"],
	fn: () => {
		featureValueIs("avatarEditorPostAvatar", true, () =>
			watchOnce(".left-wrapper .redraw-avatar").then((el) => {
				renderAfter(<PostAvatarButton />, el);
			}),
		);

		featureValueIs("avatarEditorSearch", true, () => {
			const filters = signal(AVATAR_EDITOR_FILTERS_INITIAL_VALUE);

			filters.subscribe((value) =>
				sendMessage("avatar.setFilters", {
					creatorName: value.creatorName.toLowerCase(),
					keyword: value.keyword.toLowerCase(),
				}),
			);

			watch("#avatar-web-app .breadcrumb-container", (el) =>
				renderAfter(<AvatarEditorSearch filters={filters} />, el),
			);
		});

		featureValueIs("avatarItemArchiveInInventory", true, () => {
			sendMessage("avatar.setupArchive", undefined);

			const [value] = storageSignal<ArchivedItemsStorageValue>(ARCHIVED_ITEMS_STORAGE_KEY, {
				items: [],
			});

			value.subscribe((value) => {
				sendMessage("avatar.setArchivedItems", value.items);
			});
		});
		featureValueIs("bypassR6RestrictionModal", true, async () => {
			const namespace = await getLangNamespace("Feature.Avatar");
			watch(".MuiDialogContentText-root", (description) => {
				const btns = description.closest(".MuiPaper-elevation")?.querySelectorAll("button");
				if (!btns?.length) return;

				for (const btn of btns) {
					if (btn.textContent === namespace["Action.Switch"]) {
						if (getLocalStorage(BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY)) {
							return btn.click();
						}

						renderAfter(() => {
							const [checked, setChecked] = useState(false);

							useEffect(() => {
								const listener = () => {
									if (checked) {
										setLocalStorage(
											BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY,
											true,
										);
									}
								};

								btn.addEventListener("click", listener);
								return () => btn.removeEventListener("click", listener);
							}, [checked]);

							return (
								<CheckboxField checked={checked} onChange={setChecked}>
									<label className="checkbox-label text-label">
										{getMessage("avatar.r6RestrictionModal.checkboxLabel")}
									</label>
								</CheckboxField>
							);
						}, description);

						return;
					}
				}
			});
			watch(".body-type-warning-description", (description) => {
				const btn = description
					.closest(".modal-content")
					?.querySelector<HTMLButtonElement>(".modal-footer .btn-secondary-md");
				if (!btn) {
					return;
				}

				if (getLocalStorage(BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY)) {
					return btn.click();
				}

				renderAfter(() => {
					const [checked, setChecked] = useState(false);

					useEffect(() => {
						const listener = () => {
							if (checked) {
								setLocalStorage(BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY, true);
							}
						};

						btn.addEventListener("click", listener);
						return () => btn.removeEventListener("click", listener);
					}, [checked]);

					return (
						<CheckboxField checked={checked} onChange={setChecked}>
							<label className="checkbox-label text-label">
								{getMessage("avatar.r6RestrictionModal.checkboxLabel")}
							</label>
						</CheckboxField>
					);
				}, description);
			});
		});

		featureValueIs("avatarItemLists", true, () => {
			const showModal = signal(false);
			watch(".right-panel .tab-horizontal-submenu", (panel) => {
				if (panel.hasAttribute("data-handled-last")) return;
				panel.setAttribute("data-handled-last", "");

				renderAppend(<EditItemListsButton show={showModal} />, panel);
			});

			renderAppendBody(<EditItemListsModal show={showModal} />);

			storage.get([AVATAR_ITEM_LISTS_STORAGE_KEY]).then((data) => {
				const value: AvatarItemListsStorageValue | undefined =
					data[AVATAR_ITEM_LISTS_STORAGE_KEY];

				watchOnce("#avatar-web-app").then((el) => {
					if (value?.lists?.length) {
						el.setAttribute("data-has-item-lists", "");
					} else {
						el.removeAttribute("data-has-item-lists");
					}
				});
				if (!value) return;

				sendMessage("avatar.setItemLists", value);
			});

			watch<HTMLAnchorElement>(
				"#avatar-web-app .hlist .item-card-thumb-container",
				(itemCard) => {
					const href = itemCard.href;

					let itemId: number | undefined;
					let itemType: AvatarItemListItemType | undefined;

					if (href) {
						const match = new URL(href).pathname.match(AVATAR_ITEM_REGEX);
						if (match?.[1] === "catalog") {
							itemId = Number.parseInt(match[2], 10);
							itemType = "Asset";
						}
					} else {
						const container =
							itemCard.querySelector<HTMLDivElement>(".item-card-thumb");
						const type = container?.getAttribute("data-thumbnail-type");

						if (type === "Asset" || type === "Outfit") {
							itemId = Number.parseInt(
								container!.getAttribute("data-thumbnail-target-id") ?? "",
								10,
							);
							itemType = type === "Outfit" ? "UserOutfit" : type;
						} else if (!type && container) {
							watchAttributes(
								container,
								(_, _2, _3, _4, kill) => {
									const type = container?.getAttribute("data-thumbnail-type");
									if (type === "Asset" || type === "Outfit") {
										const itemId = Number.parseInt(
											container!.getAttribute("data-thumbnail-target-id") ??
												"",
											10,
										);

										const cardCaption =
											itemCard?.parentElement?.parentElement?.querySelector<HTMLElement>(
												".item-card-caption",
											);

										if (!cardCaption) return;

										if (cardCaption.hasAttribute("rendered")) return;
										cardCaption.setAttribute("rendered", "");
										kill?.();

										renderAppend(
											<AddToAvatarListButton
												itemType={type === "Outfit" ? "UserOutfit" : type}
												itemId={itemId}
												isOwnedOverride
												isAvatarPage
											/>,
											cardCaption,
										);
									} else if (type) {
										kill?.();
									}
								},
								["thumbnail-type"],
							);

							return;
						}
					}

					if (!itemId || !itemType) return;
					const cardCaption =
						itemCard?.parentElement?.parentElement?.querySelector<HTMLElement>(
							".item-card-caption",
						);

					if (!cardCaption) return;
					if (cardCaption.querySelector(".item-toggle-list-button-container")) return;

					renderAppend(
						<AddToAvatarListButton
							itemType={itemType}
							itemId={itemId}
							isOwnedOverride
							isAvatarPage
						/>,
						cardCaption,
					);
				},
			);

			onStorageValueUpdate<AvatarItemListsStorageValue>(
				[AVATAR_ITEM_LISTS_STORAGE_KEY],
				(_, value) => {
					watchOnce("#avatar-web-app").then((el) => {
						if (value?.lists?.length) {
							el.setAttribute("data-has-item-lists", "");
						} else {
							el.removeAttribute("data-has-item-lists");
						}
					});

					sendMessage("avatar.setItemLists", value);
				},
			);
		});

		featureValueIs("advancedAvatarCustomization", true, () => {
			watch(".redraw-avatar", (el) => {
				if (!document.body.querySelector("#advanced-customization-btn")) {
					renderAfter(<AdvancedCustomizationButton />, el);
				}
			});
		});

		featureValueIs("avatarEditorCurrentlyWearing", true, () => {
			watch("#advanced-customization-btn", (el) => {
				if (!document.body.querySelector("#currently-wearing-items"))
					renderAfter(<AvatarEditorCurrentlyWearing />, el);
			});
		});

		featureValueIs("hexBodyColors", true, async () => {
			let initialColors = (await getAuthenticatedUserAvatar()).bodyColor3s;
			const bodyColors = signal(initialColors);

			addMessageListener("avatar.bodyColorsChanged", (colors) => {
				initialColors = colors;
				bodyColors.value = colors;
			});

			onWindowRefocus(10_000, () => {
				getAuthenticatedUserAvatar().then((data) => {
					initialColors = data.bodyColor3s;
					bodyColors.value = data.bodyColor3s;
				});
			});

			effect(() => {
				if (bodyColors.value === initialColors) {
					return;
				}

				setBodyColors(bodyColors.value).then(() => {
					sendMessage("avatar.updateBodyColors", bodyColors.value);
				});
			});

			setInvokeListener("avatar.wearCharacter", (data) => {
				return getOutfitById({
					outfitId: data.characterId,
				}).then(async (details) => {
					initialColors = details.bodyColor3s;
					bodyColors.value = details.bodyColor3s;
					try {
						await setBodyColors(details.bodyColor3s);
						await setAvatarType({
							playerAvatarType: details.playerAvatarType,
						});
						await setScales(details.scale);
						await sleep(100);

						const wornAssets = await setWearingAssets({
							assets: details.assets,
						});
						sendMessage("avatar.updateDetailsFromOutfit", details);

						if (wornAssets?.invalidAssets?.length) {
							warning(
								getMessage("avatar.wearCharacter.errors.invalidAssets", {
									count: asLocaleString(wornAssets.invalidAssets.length),
								}),
							);
						}
					} catch {
						warning(getMessage("avatar.wearCharacter.errors.genericError"));
					}

					return details;
				});
			});

			addMessageListener("avatar.updateCharacter", (data) => {
				renderAppendBody(<UpdateCharacterModal characterId={data.characterId} />);
			});

			watch(".bodycolors-list-sm", (el) => {
				if (el.querySelector(".bodycolors-list-v2")) {
					return;
				}

				const selectedPart = signal<keyof AvatarColors3s | "all">("all");
				for (const radio of el.parentElement!.querySelectorAll(".radio label")) {
					const type = radio.getAttribute("for")?.match(/radio-(.+)Id/)?.[1] ?? "all";
					radio.addEventListener("click", () => {
						selectedPart.value =
							type === "all" ? type : (`${type}3` as keyof AvatarColors3s);
					});
				}

				renderAppend(
					<SetBodyColor selectedPart={selectedPart} bodyColors={bodyColors} />,
					el,
				);
			});

			watch(
				'[ng-controller="bodyColorsController"] .bodycolors-list, #bodyColors .bodycolors-list',
				(el) => {
					if (el.parentElement?.querySelector(".bodycolors-list-v2")) {
						return;
					}
					renderAfter(<SetBodyColors bodyColors={bodyColors} />, el);
				},
			);

			addMessageListener("avatar.createCharacter", () => {
				renderAppendBody(<CreateCharacterModal />);
			});
		});
	},
};
