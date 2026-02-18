import type { ComponentType, VNode } from "preact";
import type { PropsWithChildren } from "preact/compat";
import { addMessageListener, invokeMessage } from "src/ts/helpers/communication/dom";
import { watchOnce } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import { hijackComponent, hijackCreateElement } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getPlaceVotesRaw } from "src/ts/helpers/requests/services/places";
import { multigetGUACPolicies } from "src/ts/helpers/requests/services/testService";
import {
	getUniverseAgeRecommendations,
	multigetUniversesByIds,
	multigetUniversesPlayabilityStatuses,
	type ExperienceEvent,
} from "src/ts/helpers/requests/services/universes";
import { getUniverseVoiceSettings } from "src/ts/helpers/requests/services/voice";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { EXPERIENCE_DEEPLINK_REGEX, EXPERIENCE_DETAILS_REGEX } from "src/ts/utils/regex";

type PortaledEventsProps = PropsWithChildren<{
	eventList: ExperienceEvent[];
}>;

let promise: Promise<string> | undefined;
function PortaledEvents({ children, ...props }: PortaledEventsProps) {
	const [el, setEl] = window.React.useState<HTMLElement>();

	window.React.useEffect(() => {
		if (!promise) {
			promise = invokeMessage(
				"experience.events.onReady",
				(
					props as {
						eventList: ExperienceEvent[];
					}
				).eventList.length,
			);
		}

		promise.then((selector) => watchOnce(selector).then(setEl));
	}, []);

	return el ? window.ReactDOM.createPortal(children, el) : null;
}

export default {
	id: "experience.details",
	regex: [EXPERIENCE_DETAILS_REGEX, EXPERIENCE_DEEPLINK_REGEX],
	fn: async () => {
		let component: VNode | undefined;
		let container: Element | undefined;

		const handleFirstRender = () => {
			if (!component || !container) {
				return;
			}

			addMessageListener("experience.unmountPlayButton", () => {
				window?.ReactDOM.unmountComponentAtNode(container!);
			});
			addMessageListener("experience.renderPlayButton", () => {
				window?.ReactDOM.render(component!, container!);
			});
		};

		addMessageListener("experience.store.promptPurchase", (itemId) => {
			const buyButton = document.querySelector<HTMLElement>(`[data-product-id="${itemId}"]`);
			if (!buyButton) {
				return;
			}

			window.Roblox.GamePassItemPurchase?.openPurchaseVerificationView(
				buyButton,
				"game-pass",
			);
		});

		hijackComponent(
			(_, el) => el.id === "game-details-play-button-container",
			(_component, _container) => {
				const existedBefore = !!container;
				component = _component;
				container = _container;

				if (!existedBefore) {
					setTimeout(handleFirstRender);
				}
			},
		);

		featureValueIsInject("disableExperienceCarouselVideoAutoplay", true, () => {
			onSet(window, "React").then((react) =>
				hijackFunction(
					react,
					(target, thisArg, args) => {
						try {
							if (String(args[0]).includes("GamePreviewVideoAutoPlayError")) {
								return target.apply(target, [() => {}]);
							}
						} catch {}

						return target.apply(thisArg, args);
					},
					"useEffect",
				),
			);
		});

		featureValueIsInject("moveExperienceEvents", true, () => {
			hijackCreateElement(
				(_, props) => !!props && "eventList" in props,
				(createElement, type, props) => {
					return createElement(PortaledEvents, {
						...props,
						children: createElement(type as ComponentType, props!), // crackhead technology? i do not understand why it doesnt accept it in children argument
					} as PortaledEventsProps);
				},
			);
		});

		const placeDataset = (await watchOnce<HTMLElement>("#game-detail-meta-data"))?.dataset;

		if (!placeDataset?.universeId || !placeDataset.placeName || !placeDataset.placeId) {
			return;
		}

		const universeId = Number.parseInt(placeDataset.universeId, 10);
		const placeId = Number.parseInt(placeDataset.placeId, 10);

		featureValueIsInject("prefetchRobloxPageData", true, () => {
			const universeData = multigetUniversesByIds({
				universeIds: [universeId],
			});

			const universePlayabilityStatus = multigetUniversesPlayabilityStatuses({
				universeIds: [universeId],
			});
			const universeVoiceSettings = getUniverseVoiceSettings({
				universeId,
			});

			const guacData = multigetGUACPolicies({
				behaviorNames: ["app-policy", "play-button-ui"],
			});

			const votingService = getPlaceVotesRaw({
				placeId,
			});

			const ageRecommendations = getUniverseAgeRecommendations({
				universeId,
			});

			let endUniverseDataHijack = false;
			let maxUniversePlayabilityHijack = 2;

			hijackRequest((req) => {
				const url = new URL(req.url);

				if (url.hostname === getRobloxUrl("apis")) {
					if (
						url.pathname === "/guac-v2/v1/bundles/app-policy" ||
						url.pathname === "/guac-v2/v1/bundles/play-button-ui"
					) {
						return guacData.then((res) => {
							const guac = res.results.find(
								(result) => result.name === url.pathname.split("/").pop(),
							);

							if (!guac) return;

							return new Response(JSON.stringify(guac), {
								headers: {
									"content-type": "application/json",
								},
							});
						});
					}

					if (
						url.pathname ===
						"/experience-guidelines-api/experience-guidelines/get-age-recommendation"
					) {
						return ageRecommendations.then(
							(res) =>
								new Response(JSON.stringify(res), {
									headers: {
										"content-type": "application/json",
									},
								}),
						);
					}
				}

				if (url.hostname === getRobloxUrl("games")) {
					if (
						maxUniversePlayabilityHijack > 0 &&
						url.pathname === "/v1/games/multiget-playability-status" &&
						url.searchParams.get("universeIds") === universeId.toString()
					) {
						maxUniversePlayabilityHijack--;

						return universePlayabilityStatus
							.then(
								(res) =>
									new Response(JSON.stringify(res), {
										headers: {
											"content-type": "application/json",
										},
									}),
							)
							.catch(() => {
								maxUniversePlayabilityHijack = 0;
							});
					}

					if (
						!endUniverseDataHijack &&
						url.pathname === "/v1/games" &&
						url.searchParams.get("universeIds") === universeId.toString()
					) {
						return universeData
							.then(
								(res) =>
									new Response(
										JSON.stringify({
											data: res,
										}),
										{
											headers: {
												"content-type": "application/json",
											},
										},
									),
							)
							.finally(() => {
								endUniverseDataHijack = true;
							});
					}
				}
				
				if (
					url.hostname === getRobloxUrl("voice") &&
					url.pathname === `/v1/settings/universe/${universeId}`
				) {
					return universeVoiceSettings.then(
						(res) =>
							new Response(JSON.stringify(res), {
								headers: {
									"content-type": "application/json",
								},
							}),
					);
				}

				if (
					url.hostname === getRobloxUrl("www") &&
					url.pathname === `/games/votingservice/${placeId}`
				) {
					return votingService.then(
						(res) =>
							new Response(res, {
								headers: {
									"content-type": "text/html",
								},
							}),
					);
				}
			});
		});
	},
} satisfies Page;
