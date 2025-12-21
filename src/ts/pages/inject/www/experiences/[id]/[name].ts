import type { ComponentType, VNode } from "preact";
import type { PropsWithChildren } from "preact/compat";
import { addMessageListener, invokeMessage } from "src/ts/helpers/communication/dom";
import { watchOnce } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackComponent, hijackCreateElement } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { ExperienceEvent } from "src/ts/helpers/requests/services/universes";
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
					return createElement(
						PortaledEvents,
						props as PortaledEventsProps,
						createElement(type as ComponentType, props!),
					);
				},
			);
		});
	},
} satisfies Page;
