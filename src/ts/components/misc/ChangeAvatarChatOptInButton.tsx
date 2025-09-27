import MdOutlineVideocam from "@material-symbols/svg-400/outlined/videocam-fill.svg";
import MdOutlineVideocamOff from "@material-symbols/svg-400/outlined/videocam_off-fill.svg";

import {
	getUserVoiceSettings,
	setUserAvatarChatOptInStatus,
} from "src/ts/helpers/requests/services/voice";
import usePromise from "../hooks/usePromise";
import classNames from "classnames";
import Tooltip from "../core/Tooltip";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useCallback, useState } from "preact/hooks";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";

export default function ChangeAvatarChatOptIn() {
	const [loading, setLoading] = useState(false);
	const [settings, , , , setSettings] = usePromise(getUserVoiceSettings, []);

	const disabled = settings?.isAvatarVideoOptInDisabled !== false;
	const isUserOptIn = !disabled && settings?.isAvatarVideoOptIn;

	const onToggle = useCallback(() => {
		if (loading || disabled) return;

		setLoading(true);
		setUserAvatarChatOptInStatus({
			isUserOptIn: !isUserOptIn,
		})
			.then(() =>
				setSettings({
					...settings,
					isAvatarVideoOptIn: !isUserOptIn,
				}),
			)
			.catch(() =>
				warning(getMessage("navigation.avatarChatOptInSwitcher.systemFeedback.error")),
			)
			.finally(() => setLoading(false));
	}, [disabled, loading, isUserOptIn]);

	return (
		<Tooltip
			placement="bottom"
			as="li"
			containerId="avatar-chat-opt-in-switcher"
			containerClassName={classNames("navbar-icon-item", {
				"roseal-disabled": disabled || loading,
			})}
			includeContainerClassName={false}
			className="avatar-chat-opt-in-switcher-tooltip"
			button={
				<button type="button" className="btn-generic-navigation" onClick={onToggle}>
					<span id="nav-avatar-chat-opt-in-icon" className="rbx-menu-item">
						{isUserOptIn ? (
							<MdOutlineVideocam className="roseal-icon" />
						) : (
							<MdOutlineVideocamOff className="roseal-icon" />
						)}
					</span>
				</button>
			}
		>
			{getMessage(
				`navigation.avatarChatOptInSwitcher.${isUserOptIn ? "enabled" : "disabled"}`,
			)}
		</Tooltip>
	);
}
