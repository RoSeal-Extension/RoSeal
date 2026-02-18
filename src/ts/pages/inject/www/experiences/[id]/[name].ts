import type { ComponentType, VNode } from "preact";
import type { PropsWithChildren } from "preact/compat";
import { addMessageListener, invokeMessage } from "src/ts/helpers/communication/dom";
import { watchOnce } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import { hijackComponent, hijackCreateElement } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import {
	getLayersValues,
	multigetGUACPolicies,
} from "src/ts/helpers/requests/services/testService";
import {
	multigetUniversesPlayabilityStatuses,
	getExperienceViewDetails,
	type ExperienceEvent,
	listExperienceEvents,
} from "src/ts/helpers/requests/services/universes";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
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
			const authenticatedUser = getAuthenticatedUser();

			const allUniverseData = getExperienceViewDetails({
				universeId,
			}).then(async (res) => {
				const data = res.sdui.feed.props.experienceDetails;

				return {
					universeData: {
						...data.gameDetails,
						isFavoritedByUser: data.isFavorited,
						favoritedCount: data.favoriteCount,
					},
					textFilterProfanity: data.textFilterProfanity,
					followingStatus: {
						UniverseId: universeId,
						UserId: (await authenticatedUser)?.userId,
						CanFollow: data.followingStatus.canFollow,
						IsFollowing: data.followingStatus.isFollowing,
						FollowingCountByType: data.followingStatus.followingCountByType,
						FollowingLimitByType: data.followingStatus.followingLimitByType,
					},
					voiceSettings: {
						isUniverseEnabledForAvatarVideo: data.isCameraSupported,
						isUniverseEnabledForVoice: data.isVoiceSupported,
					},
					ageRecommendations: {
						...data.ageRecommendations,
						ageRecommendationsDetails: undefined,
						ageRecommendationDetails: data.ageRecommendations.ageRecommendationsDetails,
					},
					mediaGallery: {
						data: data.mediaGallery,
					},
					socialLinks: {
						data: data.socialLinks,
					},
					relatedGames: {
						games: data.relatedGames,
					},
					votingService: `
<li id="voting-section" class="voting-panel body" data-target-id="${placeId}" data-total-up-votes="${data.totalUpVotes}" data-total-down-votes="${data.totalDownVotes}" data-vote-modal="" data-user-authenticated="${(await authenticatedUser) ? "true" : "false"}" data-vote-url="${getRobloxUrl("apis")}/voting-api/vote/asset/${placeId}?vote=" data-register-url="" data-account-page-url="">
  <div class="spinner spinner-sm loading"></div>
  <div class="vote-summary">
    <div class="voting-details">
      <div class="users-vote ${data.userVote.userVote !== null ? "has-voted" : ""}">
        <div class="upvote">
          <span class="icon-like ${data.userVote.userVote === true ? " selected" : ""}"></span>
        </div>
        <div class="vote-details">
          <div class="vote-container">
            <div class="vote-background"></div>
            <div class="vote-percentage"></div>
            <div class="vote-mask">
              <div class="segment seg-1"></div>
              <div class="segment seg-2"></div>
              <div class="segment seg-3"></div>
              <div class="segment seg-4"></div>
            </div>
          </div>
          <div class="vote-numbers">
            <div class="count-left">
              <span id="vote-up-text" title="${data.totalUpVotes}" class="vote-text">${data.totalUpVotes}</span>
            </div>
            <div class="count-right">
              <span id="vote-down-text" title="${data.totalDownVotes}" class="vote-text">${data.totalDownVotes}</span>
            </div>
          </div>
        </div>
        <div class="downvote">
          <span class="icon-dislike ${data.userVote.userVote === false ? " selected" : ""}"></span>
        </div>
      </div>
    </div>
  </div>
</li>`,
				};
			});

			const universePlayabilityStatus = multigetUniversesPlayabilityStatuses({
				universeIds: [universeId],
			});
			const guacData = multigetGUACPolicies({
				behaviorNames: [
					"app-policy",
					"play-button-ui",
					"intl-auth-compliance",
					"abuse-reporting-revamp",
				],
			});
			const ixpData = getLayersValues({
				projectId: 1,
				layers: {
					"Website.GameDetails": {},
				},
			});
			const universeEvents = listExperienceEvents({
				universeId,
				endsAfter: new Date().toISOString(),
			});

			let endUniverseDataHijack = false;
			let maxUniversePlayabilityHijack = 2;
			let endUniverseEventsHijack = false;

			hijackRequest(async (req) => {
				const url = new URL(req.url);

				const authenticatedUserId = (await authenticatedUser)?.userId;
				if (url.hostname === getRobloxUrl("followings")) {
					if (
						url.pathname ===
							`/v1/users/${authenticatedUserId}/universes/${universeId}/status` &&
						req.method === "GET"
					) {
						return allUniverseData.then(
							(res) =>
								new Response(JSON.stringify(res.followingStatus), {
									headers: {
										"content-type": "application/json",
									},
								}),
						);
					}
				}
				if (url.hostname === getRobloxUrl("apis")) {
					if (
						url.pathname === "/guac-v2/v1/bundles/app-policy" ||
						url.pathname === "/guac-v2/v1/bundles/play-button-ui" ||
						url.pathname === "/guac-v2/v1/bundles/abuse-reporting-revamp" ||
						url.pathname === "/guac-v2/v1/bundles/intl-auth-compliance"
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
						return allUniverseData.then(
							(res) =>
								new Response(JSON.stringify(res.ageRecommendations), {
									headers: {
										"content-type": "application/json",
									},
								}),
						);
					}

					if (
						!endUniverseEventsHijack &&
						url.pathname === `/virtual-events/v1/universes/${universeId}/virtual-events`
					) {
						return universeEvents
							.then((res) => {
								return new Response(JSON.stringify(res), {
									headers: {
										"content-type": "application/json",
									},
								});
							})
							.finally(() => {
								endUniverseEventsHijack = true;
							});
					}

					if (
						url.pathname.startsWith(
							"/product-experimentation-platform/v1/projects/1/layers/Website.GameDetails/values",
						)
					) {
						return ixpData.then(
							(res) =>
								new Response(
									JSON.stringify(res.layers["Website.GameDetails"].parameters),
									{
										headers: {
											"content-type": "application/json",
										},
									},
								),
						);
					}

					if (url.pathname === "/product-experimentation-platform/v1/projects/1/values") {
						return req
							.clone()
							.json()
							.then((data) => {
								if (
									typeof data === "object" &&
									data !== null &&
									"layers" in data &&
									typeof data.layers === "object" &&
									data.layers !== null &&
									"Website.GameDetails" in data.layers
								) {
									return ixpData.then(
										(res) =>
											new Response(JSON.stringify(res), {
												headers: {
													"content-type": "application/json",
												},
											}),
									);
								}
							});
					}

					if (
						url.pathname === `/asset-text-filter-settings/public/universe/${universeId}`
					) {
						return allUniverseData.then((res) => {
							return new Response(
								JSON.stringify({
									Profanity: res.textFilterProfanity,
								}),
								{
									headers: {
										"content-type": "application/json",
									},
								},
							);
						});
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
						return allUniverseData
							.then(
								(res) =>
									new Response(
										JSON.stringify({
											data: [res.universeData],
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

					if (url.pathname === `/v2/games/${universeId}/media`) {
						return allUniverseData.then(
							(res) =>
								new Response(JSON.stringify(res.mediaGallery), {
									headers: {
										"content-type": "application/json",
									},
								}),
						);
					}

					if (url.pathname === `/v1/games/${universeId}/social-links/list`) {
						return allUniverseData.then((res) => {
							return new Response(JSON.stringify(res.socialLinks), {
								headers: {
									"content-type": "application/json",
								},
							});
						});
					}

					if (url.pathname === `/v1/games/recommendations/game/${universeId}`) {
						return allUniverseData.then((res) => {
							return new Response(JSON.stringify(res.relatedGames), {
								headers: {
									"content-type": "application/json",
								},
							});
						});
					}
				}

				if (
					url.hostname === getRobloxUrl("voice") &&
					url.pathname === `/v1/settings/universe/${universeId}`
				) {
					return allUniverseData.then(
						(res) =>
							new Response(JSON.stringify(res.voiceSettings), {
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
					return allUniverseData.then(
						(res) =>
							new Response(res.votingService, {
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
