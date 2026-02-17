import { useSignal } from "@preact/signals";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
	addMessageListener,
	invokeMessage,
	type MessageTarget,
	sendMessage,
} from "src/ts/helpers/communication/dom";
import { watchAttributes, watchOnce } from "src/ts/helpers/elements";
import type { Feature } from "src/ts/helpers/features/featuresData";
import { locales } from "src/ts/helpers/i18n/locales.ts";
import type { InjectScript } from "src/ts/utils/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type FeaturePermissionsContainerProps = {
	feature: Feature;
	showError: boolean;
};

export function FeaturePermissionsContainer({
	feature,
	showError,
}: FeaturePermissionsContainerProps) {
	const [bodyClassName, setBodyClassName] = useState(document.body?.className);
	const [stylesLoaded, setStylesLoaded] = useState(false);
	const [height, setHeight] = useState(0);

	const url = useMemo(
		() =>
			browser.runtime.getURL(
				`html/popup.html?type=embedded&locales=${locales.join(",")}&bodyClassName=${
					document.body?.className
				}&subType=featurePermissions&featureId=${feature.id}`,
			),
		[bodyClassName],
	);
	useEffect(() => {
		watchOnce("body").then((body) => {
			if (!bodyClassName?.length) {
				setBodyClassName(body.className);
			}

			watchAttributes(body, () => {
				setBodyClassName(body.className);
			}, ["class"]);
		});
	}, []);

	const target = useSignal<MessageTarget | undefined>(undefined);
	const ref = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		sendMessage("featurePermissions.showError", showError, target.value);
	}, [showError]);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const documentReady = addMessageListener("documentReady", () => {
			if (!ref.current?.contentWindow || !ref.current.isConnected) {
				target.value = undefined;
				return;
			}

			target.value = {
				url,
				window: ref.current.contentWindow,
			};

			const styles: InjectScript[] = [];
			for (const link of document.querySelectorAll<HTMLLinkElement>(
				'link[rel="stylesheet"]',
			)) {
				styles.push({
					tagName: link.tagName as "LINK",
					href: link.href,
					rel: "stylesheet",
					type: "text/css",
				});
			}

			invokeMessage("injectStyles", styles, {
				url,
				window: ref.current.contentWindow,
			}).then(() => {
				setStylesLoaded(true);
			});
		});

		const heightChanged = addMessageListener("scrollHeightChanged", (height, target) => {
			if (
				!ref.current?.contentWindow ||
				!ref.current.isConnected ||
				target?.window !== ref.current.contentWindow
			) {
				return;
			}

			setHeight(height);
		});

		return () => {
			heightChanged();
			documentReady();
		};
	}, [ref.current]);

	return (
		<iframe
			title={getMessage("settings.features.permissions")}
			className="feature-permissions-iframe"
			ref={ref}
			src={url}
			style={{
				width: stylesLoaded && height ? null : "0px",
				height: stylesLoaded ? `${height}px` : "0px",
			}}
		/>
	);
}
