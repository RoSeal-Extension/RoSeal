import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import { hijackCreateElement } from "src/ts/helpers/hijack/react";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { MY_ACCOUNT_REGEX } from "src/ts/utils/regex";
import type { JSX, createElement } from "preact";
import { getMessageInject } from "src/ts/helpers/domInvokes";
import { type Signal, signal } from "@preact/signals";

type ThemeChangerHellProps = {
	props: {
		value: "Dark" | "Light";
		onValueChange: (value: string) => void;
	};
	isSync: Signal<boolean>;
	type: () => void;
	children: JSX.Element[];
	setIsSync: (value: boolean) => void;
	createElement: typeof createElement;
	setSetIsSync: (value?: ((value: boolean) => void) | undefined) => void;
	syncMessage: string;
};

function ThemeChangerHell({
	type,
	props,
	children,
	isSync,
	createElement,
	syncMessage,
}: ThemeChangerHellProps) {
	const [value, setValue] = window.React.useState<string>(isSync ? "Sync" : props.value);

	window.React.useEffect(() => {
		return isSync.subscribe((value) => {
			setValue(value ? "Sync" : props.value);
		});
	}, [setValue, props.value]);

	window.React.useEffect(() => {
		if (isSync) return;

		setValue(props.value);
	}, [props.value]);

	const onValueChange = window.React.useCallback(
		(value: string) => {
			isSync.value = value === "Sync";

			sendMessage("settings.changeTheme", {
				isSync: value === "Sync",
			});

			setValue(value);
			if (value !== "Sync") {
				return props.onValueChange(value);
			}
		},
		[props.onValueChange, setValue, value],
	);

	try {
		const itemChildren = children?.[0]?.props?.children?.props?.children;

		if (itemChildren?.[1] && !itemChildren?.[2]) {
			itemChildren.push(
				window.React.cloneElement(itemChildren[1], {
					key: "Sync",
					title: syncMessage,
					value: "Sync",
				}),
			);
		}
	} catch {}

	return createElement(
		// @ts-expect-error: SHUT UP!!!!
		type,
		{
			...props,
			value: value,
			onValueChange,
		},
		...children,
	);
}

export default {
	id: "myAccount",
	regex: [MY_ACCOUNT_REGEX],
	fn: () => {
		featureValueIsInject("syncBrowserThemeOption", true, async () => {
			const syncMessage = await getMessageInject("robloxSettings.theme.syncTheme");
			const isSync = signal(false);

			addMessageListener("settings.changeTheme", (data) => {
				isSync.value = data.isSync;
			});

			hijackCreateElement(
				(_, props) =>
					props !== null &&
					"value" in props &&
					(props.value === "Light" || props.value === "Dark") &&
					"onValueChange" in props,
				(createElement, type, props, ...children) => {
					return createElement(ThemeChangerHell, {
						type,
						props,
						children,
						isSync,
						syncMessage,
						createElement,
					} as ThemeChangerHellProps);
				},
			);
		});
		featureValueIsInject("betterPrivateServersSubscriptions", true, () => {
			hijackRequest((req) => {
				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("games")) {
					if (url.pathname === "/v1/private-servers/my-private-servers") {
						return new Response(
							JSON.stringify({
								data: [],
							}),
							{
								headers: {
									"content-type": "application/json",
								},
							},
						);
					}
				}
			});
		});
	},
} satisfies Page;
