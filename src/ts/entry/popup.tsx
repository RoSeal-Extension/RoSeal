import { render } from "preact";
import type { PopupData } from "src/types/dataTypes";
import FeaturePermissions from "../components/popup/Permissions";
import { sendMessage, setInvokeListener } from "../helpers/communication/dom";
import { features, type AnyFeature, type Feature } from "../helpers/features/featuresData";
import { getMessage } from "../helpers/i18n/getMessage";
import currentUrl from "../utils/currentUrl";
import { injectScripts, onDOMReady } from "../utils/dom";

type PopupType = "regular" | "embedded";
type PopupSubType = "featurePermissions";

const type: PopupType = (currentUrl.value.url.searchParams.get("type") as PopupType) ?? "regular";
const subType: PopupSubType | undefined = currentUrl.value.url.searchParams.get("subType") as
	| PopupSubType
	| undefined;

if (import.meta.env.TARGET_BASE !== "firefox") {
	if (type === "embedded" && subType === "featurePermissions") {
		const featureId = currentUrl.value.url.searchParams.get("featureId");

		if (featureId) {
			let scrollHeight = 0;

			const checkScrollHeight = () => {
				if (!document.body) return;

				const newHeight = document.body.scrollHeight;
				if (newHeight !== scrollHeight) {
					scrollHeight = newHeight;
					sendMessage("scrollHeightChanged", newHeight, {
						window: top!,
						url: "*",
					});
				}
			};

			setInvokeListener("injectStyles", (scripts) => {
				checkScrollHeight();

				return injectScripts(
					scripts.filter(
						(item) =>
							item.tagName === "LINK" &&
							item.rel === "stylesheet" &&
							item.type === "text/css",
					),
				);
			});

			sendMessage("documentReady", undefined, {
				window: top!,
				url: "*",
			});

			onDOMReady(() => {
				document.body.className =
					currentUrl.value.url.searchParams.get("bodyClassName") || "";
				const feature = features[featureId as AnyFeature["id"]] as Feature;
				if (!feature) {
					return;
				}

				setInterval(checkScrollHeight, 100);

				return render(
					<FeaturePermissions feature={feature} />,
					document.querySelector("#app")!,
				);
			});
		}
	}
} else if (type === "regular") {
	let permissions: PopupData | undefined;
	onDOMReady(() => {
		document.body.textContent = getMessage("featurePermissions.options.default");

		browser.runtime.onMessage.addListener((data) => {
			if (data.action !== "requestPermissions") {
				return;
			}

			document.body.textContent = getMessage(
				`featurePermissions.options.${data.args.remove ? "revoke" : "grant"}`,
			);
			if (!permissions) {
				document.addEventListener("click", () => {
					(permissions?.remove
						? browser.permissions.remove
						: browser.permissions.request)(permissions!.permissions).then((success) => {
						if (success) {
							document.body.textContent = getMessage(
								"featurePermissions.options.done",
							);
						}
					});
				});
			}
			permissions = data.args;
		});
	});
}
