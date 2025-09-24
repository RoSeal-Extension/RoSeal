import MdOutlineMic from "@material-symbols/svg-400/outlined/mic-fill.svg";
import MdOutlineMicOff from "@material-symbols/svg-400/outlined/mic_off-fill.svg";

import {
	getUserVoiceSettings,
	setUserVoiceOptInStatus,
} from "src/ts/helpers/requests/services/voice";
import usePromise from "../hooks/usePromise";
import classNames from "classnames";
import Tooltip from "../core/Tooltip";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getRegularTime } from "src/ts/helpers/i18n/intlFormats";

export default function ChangeVoiceOptInButton() {
	const [settings, , , , setSettings] = usePromise(getUserVoiceSettings, []);

	const isBanned = settings?.isBanned;
	const disabled =
		!isBanned &&
		(settings?.isUserOptIn === undefined ||
			settings?.isOptInDisabled === true ||
			(settings?.canVerifyAgeForVoice === true && settings?.isVerifiedForVoice === false));
	const isUserOptIn = !disabled && settings?.isUserOptIn;

	return (
		<Tooltip
			placement="bottom"
			as="li"
			containerId="voice-opt-in-switcher"
			containerClassName={classNames("navbar-icon-item", {
				"roseal-disabled": disabled,
				"is-banned": settings?.isBanned,
			})}
			includeContainerClassName={false}
			className="voice-opt-in-switcher-tooltip"
			button={
				<button
					type="button"
					className="btn-generic-navigation"
					onClick={() => {
						if (disabled || isBanned) return;

						setUserVoiceOptInStatus({
							isUserOptIn: !isUserOptIn,
						}).then(() => {
							setSettings({
								...settings,
								isUserOptIn: !isUserOptIn,
							});
						});
					}}
				>
					<span id="nav-voice-opt-in-icon" className="rbx-menu-item">
						{isUserOptIn ? (
							<MdOutlineMic className="roseal-icon" />
						) : (
							<MdOutlineMicOff className="roseal-icon" />
						)}
					</span>
				</button>
			}
		>
			{isBanned
				? settings?.bannedUntil
					? getMessage("navigation.voiceChatOptInSwitcher.bannedUntil", {
							date: getRegularTime(settings?.bannedUntil.Seconds * 1000),
						})
					: getMessage("navigation.voiceChatOptInSwitcher.bannedIndefinitely")
				: getMessage(
						`navigation.voiceChatOptInSwitcher.${isUserOptIn ? "enabled" : "disabled"}`,
					)}
		</Tooltip>
	);
}
