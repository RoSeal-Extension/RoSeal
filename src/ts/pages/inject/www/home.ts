import {
	ALLOWED_CUSTOMIZATION_TREATMENTS,
	type CustomHomePlaylist,
	type Layout,
} from "src/ts/components/home/layoutCustomization/constants";
import {
	ACCURATE_TOPIC_HANDLING,
	transformState,
} from "src/ts/components/home/layoutCustomization/utils";
import { PHONE_NUMBER_UPSELL_IDS } from "src/ts/constants/home";
import { allowedItemsData, blockedItemsData } from "src/ts/constants/misc";
import { addMessageListener, invokeMessage, sendMessage } from "src/ts/helpers/communication/dom";
import { watch } from "src/ts/helpers/elements";
import { featureValueIsInject, getFeatureValueInject } from "src/ts/helpers/features/helpersInject";
import { getFlagInject } from "src/ts/helpers/flags/flagsInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import { hijackCreateElement, hijackState } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import {
	type GetOmniRecommendationsRequest,
	type GetOmniRecommendationsResponse,
	multigetOmniRecommendationsMetadata,
	type OmniItem,
} from "src/ts/helpers/requests/services/universes";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { calculateFriendsCarouselNewOffsetWidth } from "src/ts/utils/friendsCarousel";
import { HOME_REGEX } from "src/ts/utils/regex";

export default {
	id: "home",
	regex: [HOME_REGEX],
	hotSwappable: true,
	fn: () => {
		let currentState: { current?: GetOmniRecommendationsResponse } = {};
		let internalState: GetOmniRecommendationsResponse | undefined;
		let updateState: ((state: GetOmniRecommendationsResponse) => void) | undefined;

		const checks: MaybePromise<(() => void | undefined) | undefined | void>[] = [];

		let hasBlockedSDUI = false;
		let hasCustomizedLayout = false;
		let hasBlockedExperience = false;

		const blockSDUI = () => {
			if (hasBlockedSDUI) return;

			hasBlockedSDUI = true;
			checks.push(
				getFlagInject("homePage", "blockSDUI").then((shouldBlockSDUI) => {
					if (!shouldBlockSDUI) return;

					return hijackRequest(async (req) => {
						if (!hasCustomizedLayout && !hasBlockedExperience) return;

						const url = new URL(req.url);
						if (
							url.hostname === getRobloxUrl("apis") &&
							url.pathname === "/discovery-api/omni-recommendation"
						) {
							const body = (await req
								.clone()
								.json()) as GetOmniRecommendationsRequest;

							if (body.sduiTreatmentTypes)
								body.sduiTreatmentTypes = body.sduiTreatmentTypes.filter(
									(item) => !ALLOWED_CUSTOMIZATION_TREATMENTS.includes(item),
								);

							return new Request(req, {
								body: JSON.stringify(body),
							});
						}
					});
				}),
			);
		};

		checks.push(
			blockedItemsData.subscribe((blockedData) => {
				const _hasCreatorConfig =
					blockedData?.creators.length || allowedItemsData.value?.creators.length;
				const hasCreatorConfig = _hasCreatorConfig !== undefined && _hasCreatorConfig !== 0;

				const _hasExperienceConfig =
					blockedData?.experiences.ids.length ||
					blockedData?.experiences.names.length ||
					blockedData?.experiences.descriptions.length ||
					allowedItemsData.value?.experiences.ids.length ||
					hasCreatorConfig;
				const hasExperienceConfig =
					_hasExperienceConfig !== undefined &&
					_hasExperienceConfig !== 0 &&
					_hasExperienceConfig !== false;
				if (hasExperienceConfig) {
					blockSDUI();
					hasBlockedExperience = true;
				}
			}),
		);

		checks.push(
			featureValueIsInject("improvedConnectionsCarousel", true, () => {
				checks.push(
					hijackCreateElement(
						(_, props) =>
							props !== null &&
							"carouselName" in props &&
							props.carouselName === "WebHomeFriendsCarousel" &&
							!("rosealCheck" in props),
						() => null,
					),
				);

				onSet(window, "React").then((react) =>
					onSet(window, "ReactDOM").then((reactDom) => {
						const el = react.createElement(
							() => {
								const res = react.createElement("div", {});

								queueMicrotask(() => {
									if (
										"className" in res.props &&
										typeof res.props.className === "string"
									) {
										const btr = res.props.className.includes("btr-friends");
										const btrSecondRow =
											res.props.className.includes("btr-friends-secondRow");

										sendMessage("home.setBTRFeatureDetection", {
											btr,
											btrSecondRow,
										});
									}
								});
								return res;
							},
							{
								rosealCheck: true,
								friendsList: [],
								carouselName: "WebHomeFriendsCarousel",
							},
						);

						const frag = document.createDocumentFragment();

						reactDom.render(el, frag);
						reactDom.unmountComponentAtNode(frag);
					}),
				);
			}),
		);

		checks.push(
			featureValueIsInject("hideAddFriendsButton", true, () => {
				hijackCreateElement(
					(_, props) => !!props && "isAddFriendsTileEnabled" in props,
					(_, __, props) => {
						const propsType = props as unknown as {
							isAddFriendsTileEnabled: boolean;
							badgeCount: number;
						};

						propsType.badgeCount = 0;
						propsType.isAddFriendsTileEnabled = false;
					},
				);
			}),
			getFeatureValueInject("expandHomeContent").then((value) => {
				if (!value?.[0]) {
					return;
				}

				checks.push(
					watch("#HomeContainer", (container) => {
						if (value[1] === "shrink") {
							container.classList.remove("expand-max-width");
						} else {
							container.classList.add("expand-max-width");
						}
					}),
					hijackState({
						matches: (value) => {
							return (
								value !== null &&
								typeof value === "object" &&
								"IsExpandHomeContentEnabled" in value
							);
						},
						setState: ({ value: props }) => {
							(
								props.current as unknown as { IsExpandHomeContentEnabled: boolean }
							).IsExpandHomeContentEnabled = value[1] === "expand";

							return props.current;
						},
					}),
				);
			}),
			getFeatureValueInject("homeFriendsRows").then((value) => {
				if (!value?.[0] || value[1] === 1) {
					return;
				}

				return hijackCreateElement(
					(_, props) =>
						!!props &&
						"className" in props &&
						props.className === "friends-carousel-container" &&
						"ref" in props,
					(_, __, props) => {
						const propsType = props as unknown as {
							ref: (div?: HTMLDivElement) => void;
						};

						hijackFunction(
							propsType,
							(target, thisArgs, args) => {
								const el = args[0];
								if (!el) {
									return null;
								}

								target.apply(thisArgs, [
									Object.defineProperty(el, "offsetWidth", {
										configurable: true,
										get: () =>
											calculateFriendsCarouselNewOffsetWidth(el, value[1]),
									}),
								]);
							},
							"ref",
						);
					},
				);
			}),
			featureValueIsInject("userJoinCheck", true, () =>
				watch(
					'[data-testid="game-players-player-interaction-modal"] .interaction-item',
					(item) => {
						for (const key in item) {
							if (key.startsWith("__reactProps")) {
								const userIdToFollow =
									// @ts-expect-error: Fine
									item[key as keyof item]?.children?.[1]?.props?.playerData?.id;

								if (!userIdToFollow) {
									return;
								}
								const action =
									item.querySelector<HTMLButtonElement>(".player-action");

								if (!action) {
									return;
								}

								action.classList.add("roseal-disabled");
								invokeMessage("determineCanJoinUser", {
									userIdToFollow,
								})
									.then((data) => {
										if (data.message) {
											action.textContent = data.message;
										}

										if (data.disabled) {
											action.classList.add("roseal-grayscale");
										} else {
											action.classList.remove("roseal-disabled");
										}
									})
									.catch(() => action.classList.remove("roseal-disabled"));
								return;
							}
						}
					},
				),
			),
			featureValueIsInject("customizeHomeSortsLayout", true, () => {
				let currentLayout: Layout | undefined;
				let currentPlaylists: CustomHomePlaylist[] | undefined;

				const handleUpdateLayout = (
					newLayout?: Layout,
					newPlaylists?: CustomHomePlaylist[],
				) => {
					if (newPlaylists) {
						currentPlaylists = newPlaylists;
					}
					if (newLayout) {
						currentLayout = newLayout;
					}

					if (!currentLayout?.sorts) {
						return;
					}

					for (const sort of currentLayout.sorts) {
						if (sort.override.accurate && sort.topicId in ACCURATE_TOPIC_HANDLING) {
							const value =
								ACCURATE_TOPIC_HANDLING[
									sort.topicId as keyof typeof ACCURATE_TOPIC_HANDLING
								];

							value.load();
						}
					}

					if (!updateState || !internalState) {
						return;
					}

					const sorts = transformState(
						internalState.sorts,
						currentLayout!,
						currentPlaylists,
					);
					// Due to an issue with live updating from Carousel to SortlessGrid,
					// we need to force "refresh" by removing SortlessGrid and then re-adding
					let shouldDoubleUpdate = false;

					const currentSorts = currentState.current?.sorts;

					if (currentSorts)
						for (let i = 0; i < sorts.length; i++) {
							const newSort = sorts[i];
							const oldSort = currentSorts[i];

							// 1. Check if the old sort exists at this index (safety)
							// 2. Check if the Topic IDs match (as requested)
							if (oldSort && newSort.topicId === oldSort.topicId) {
								// Logic Block 1: Changed FROM SortlessGrid
								// (Old was Sortless, New is NOT)
								if (
									oldSort.treatmentType === "SortlessGrid" &&
									newSort.treatmentType !== "SortlessGrid"
								) {
									shouldDoubleUpdate = true;
									break;
								}

								// Logic Block 2: Changed TO SortlessGrid
								// (New is Sortless, Old is NOT)
								if (
									newSort.treatmentType === "SortlessGrid" &&
									oldSort.treatmentType !== "SortlessGrid"
								) {
									shouldDoubleUpdate = true;
									break;
								}
							}
						}

					if (shouldDoubleUpdate) {
						updateState({
							...currentState.current!,
							sorts: sorts.filter((sort) => sort.treatmentType !== "SortlessGrid"),
						});
					}
					updateState({
						...currentState.current!,
						sorts,
					});

					const emptyUniverses: OmniItem[] = [];
					for (const sort of sorts) {
						if (sort.recommendationList?.length) {
							for (const item of sort.recommendationList) {
								if (
									item.contentType === "Game" &&
									!(
										item.contentId in currentState.current!.contentMetadata.Game
									) &&
									!emptyUniverses.some(
										(universe) => universe.contentId === item.contentId,
									)
								) {
									emptyUniverses.push(item);
								}
							}
						}
					}

					if (emptyUniverses.length) {
						multigetOmniRecommendationsMetadata({
							contents: emptyUniverses,
							sessionId: internalState!.requestId,
						}).then((data) => {
							const newGameData = {
								...currentState.current!.contentMetadata.Game,
							};
							for (const item of data) {
								newGameData[item.universeId] = {
									...item,
									// @ts-expect-error: Whatever, for some reason it errors when `placeId` is not present, even though it's not in the response
									placeId: item.rootPlaceId,
								};
							}
							updateState!({
								...currentState.current!,
								contentMetadata: {
									...currentState.current!.contentMetadata,
									Game: newGameData,
								},
							});
						});
					}
				};

				checks.push(
					addMessageListener("home.updateSortsLayout", (data) => {
						hasCustomizedLayout = true;
						handleUpdateLayout(data.layout, data.playlists);

						checks.push(blockSDUI());
					}),
				);

				for (const key in ACCURATE_TOPIC_HANDLING) {
					ACCURATE_TOPIC_HANDLING[
						key as unknown as keyof typeof ACCURATE_TOPIC_HANDLING
					].state.subscribe(() => {
						handleUpdateLayout();
					});
				}

				return hijackState<GetOmniRecommendationsResponse>({
					matches: (state) =>
						state !== null &&
						typeof state === "object" &&
						"sorts" in state &&
						"contentMetadata" in state,
					onStateRemoved: () => {
						for (const key in ACCURATE_TOPIC_HANDLING) {
							const value =
								ACCURATE_TOPIC_HANDLING[
									key as unknown as keyof typeof ACCURATE_TOPIC_HANDLING
								];

							if (value.state.value.loaded) {
								value.clear();
							}
						}
					},
					setState: ({ value, publicSetState }) => {
						currentState = value;
						updateState = publicSetState;

						if (!internalState) {
							internalState = value.current;
						}

						const data = currentLayout
							? {
									...value.current,
									sorts: transformState(
										internalState.sorts,
										currentLayout,
										currentPlaylists,
									),
								}
							: value.current;

						queueMicrotask(() => {
							sendMessage("home.sortsUpdated", value.current.sorts);
						});

						return data;
					},
					onlyFromSiteUpdate: true,
				});
			}),

			featureValueIsInject("removePhoneNumberUpsells", true, () =>
				hijackState({
					matches: (str) =>
						typeof str === "string" && PHONE_NUMBER_UPSELL_IDS.includes(str),
					setState: () => null,
				}),
			),
		);

		return () => {
			Promise.all(checks).then((checks) => {
				for (const check of checks) {
					if (!check) continue;

					if (typeof check === "function") check?.();
				}
			});
		};
	},
} satisfies Page;
