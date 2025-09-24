import { render } from "preact";
import { createPortal } from "preact/compat";
import Divider from "src/ts/components/core/Divider";
import Option from "src/ts/components/core/verticalMenu/Option";
import OptionContent from "src/ts/components/core/verticalMenu/OptionContent";
import BetterExperienceNotifications from "src/ts/components/settings/BetterExperienceNotifications";
import BetterGroupNotifications from "src/ts/components/settings/BetterGroupNotifications";
import BetterPrivateServerSubscriptions from "src/ts/components/settings/BetterPrivateServerSubscriptions";
import RoSealSettings from "src/ts/components/settings/RoSealSettings";
import UsernamePreviewContainer from "src/ts/components/users/UsernamePreviewContainer";
import { SYNC_THEME_ENABLED_LOCALSTORAGE_KEY } from "src/ts/constants/misc";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import { hideEl, modifyTitle, watch, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getUserVoiceSettings } from "src/ts/helpers/requests/services/voice";
import { getLocalStorage, removeLocalStorage, setLocalStorage } from "src/ts/helpers/storage";
import currentUrl from "src/ts/utils/currentUrl";

import { MY_ACCOUNT_REGEX } from "src/ts/utils/regex";
import { renderAfter, renderAppend, renderIn } from "src/ts/utils/render";
import { syncTheme } from "src/ts/utils/theme";

export default {
	id: "account.settings",
	regex: [MY_ACCOUNT_REGEX],
	css: ["css/accountSettings.css"],
	fn: async () => {
		const content = await watchOnce(".content");

		const settingsDiv = document.createElement("div");
		const renderRoSealSettings = (tabId?: string) => {
			modifyTitle("My RoSeal Settings");

			render(
				createPortal(
					<RoSealSettings
						initialActiveTabId={tabId}
						returnToRoblox={() => {
							modifyTitle("My Settings");
							render(null, settingsDiv);
							history.replaceState(undefined, "", "?");
						}}
					/>,
					content,
				),
				settingsDiv,
			);
		};
		const updateQuery = () => {
			renderRoSealSettings("features");
		};

		watchOnce("#user-account #settings-container").then(async (settingsContainer) => {
			const mobile = settingsContainer.querySelector<HTMLElement>(
				".mobile-navigation-dropdown select",
			);
			if (mobile) {
				await watchOnce(
					"#user-account #settings-container .mobile-navigation-dropdown select *",
				);
				renderIn(
					<option value="roseal-settings">
						{getMessage("robloxSettings.rosealSettings", {
							sealEmoji: SEAL_EMOJI_COMPONENT,
						})}
					</option>,
					mobile,
				);
				mobile.addEventListener(
					"change",
					(e) => {
						if ((e.target as HTMLSelectElement).value === "roseal-settings") {
							e.stopImmediatePropagation();
							updateQuery();
						}
					},
					{
						capture: true,
					},
				);
			}

			const desktop = settingsContainer.querySelector<HTMLElement>(
				".settings-left-navigation ul",
			);
			if (desktop) {
				renderIn(
					<>
						<Divider thick />
						<Option id="btn-roseal-settings">
							<OptionContent
								title={getMessage("robloxSettings.rosealSettings", {
									sealEmoji: SEAL_EMOJI_COMPONENT,
								})}
								onClick={updateQuery}
							/>
						</Option>
					</>,
					desktop,
				);
			}
		});

		featureValueIs("betterPrivateServersSubscriptions", true, () =>
			watch(".subscription-management-container .subscription-count", (el) => {
				if (
					!el.nextElementSibling ||
					document.querySelector("#private-server-subscriptions")
				)
					return;

				const container = renderAfter(
					<BetterPrivateServerSubscriptions />,
					el.nextElementSibling as HTMLElement,
				);
				if (container) {
					watch(
						el,
						() => {
							render(null, container);
						},
						true,
					);
				}
			}),
		);

		featureValueIs("syncBrowserThemeOption", true, () => {
			let currentSyncListener: (() => void) | undefined;

			sendMessage("settings.changeTheme", {
				isSync: getLocalStorage(SYNC_THEME_ENABLED_LOCALSTORAGE_KEY) === true,
			});

			addMessageListener("settings.changeTheme", (data) => {
				if (currentSyncListener) {
					currentSyncListener();
					currentSyncListener = undefined;
				}

				if (data.isSync) {
					syncTheme().then((listener) => {
						currentSyncListener = listener;
					});

					setLocalStorage(SYNC_THEME_ENABLED_LOCALSTORAGE_KEY, true);
				} else {
					removeLocalStorage(SYNC_THEME_ENABLED_LOCALSTORAGE_KEY);
				}
			});
		});

		featureValueIs("showExperienceChatUsernameColor", true, () => {
			watch<HTMLInputElement>("#desired-username-text-box", (el) => {
				renderAfter(<UsernamePreviewContainer el={el} />, el);
			});
		});

		featureValueIs("cssFixes", true, () =>
			watch(".account-previous-usernames", (el) => {
				const child = el.childNodes[0];
				if (child.nodeType === Node.TEXT_NODE) {
					const span = document.createElement("span");
					span.classList.add("text-label");
					span.textContent = child.textContent;

					el.replaceChild(span, child);
				}
			}),
		);

		featureValueIs("showVoiceChatSuspension", true, async () => {
			const data = await getUserVoiceSettings();
			if (data.isBanned && data.bannedUntil?.Seconds) {
				watch("#voiceChat-toggle", (toggle) => {
					const section = toggle.closest<HTMLElement>(".section-content")!;
					if (section?.querySelector("#restoration-date")) {
						return;
					}

					const el = (
						<div id="restoration-date" className="text-error">
							{getMessage("robloxSettings.voiceSuspensionDate", {
								date: getAbsoluteTime(new Date(data.bannedUntil!.Seconds * 1000)),
							})}
						</div>
					);

					const span = section.querySelector<HTMLElement>("span.text-description");
					if (span) {
						renderAfter(el, span);
						return;
					}

					renderAppend(el, section);
				});
			}
		});

		featureValueIs("betterNotificationPreferences", true, () =>
			watch(".group-wrapper:not(.better-notification-group)", (wrapper) => {
				if (wrapper.querySelector(".icon-play")) {
					hideEl(wrapper);
					renderAfter(<BetterExperienceNotifications />, wrapper);
				}
				if (wrapper.querySelector(".icon-menu-groups")) {
					hideEl(wrapper);
					renderAfter(<BetterGroupNotifications />, wrapper);
				}
			}),
		);

		if (
			currentUrl.value.url.searchParams.has("roseal") &&
			!["rogold", "tab", "roblokis", "conf"].some((setting) =>
				currentUrl.value.url.searchParams.has(setting),
			)
		) {
			renderRoSealSettings(currentUrl.value.url.searchParams.get("roseal") || "features");
		}
	},
} satisfies Page;
