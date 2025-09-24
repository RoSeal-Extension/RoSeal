import type { ComponentType, VNode } from "preact";
import { addMessageListener, invokeMessage } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackComponent, hijackCreateElement } from "src/ts/helpers/hijack/react";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { ExperienceEvent } from "src/ts/helpers/requests/services/universes";
import { EXPERIENCE_DEEPLINK_REGEX, EXPERIENCE_DETAILS_REGEX } from "src/ts/utils/regex";

export default {
	id: "experience.details",
	regex: [EXPERIENCE_DETAILS_REGEX, EXPERIENCE_DEEPLINK_REGEX],
	fn: () => {
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
			hijackCreateElement(
				(_, props) =>
					!!props && "onReady" in props && !!props.className?.includes("carousel-video"),
				(_, _2, props) => {
					const propsType = props as {
						onReady?: () => void;
						ref?: React.RefObject<HTMLVideoElement>;
					};
					delete propsType.onReady;
					delete propsType.ref;
				},
			);
		});

		featureValueIsInject("moveExperienceEvents", true, () => {
			let alreadySent = false;

			hijackCreateElement(
				(_, props) => !!props && "eventList" in props,
				(createElement, type, props) => {
					if (!alreadySent) {
						alreadySent = true;
						invokeMessage(
							"experience.events.onReady",
							(
								props as {
									eventList: ExperienceEvent[];
								}
							).eventList.length,
						).then((selector) => {
							window.ReactDOM.render(
								createElement(type as ComponentType, props!),
								document.querySelector(selector)!,
							);
						});
					}

					return null;
				},
			);
		});
	},
} satisfies Page;
