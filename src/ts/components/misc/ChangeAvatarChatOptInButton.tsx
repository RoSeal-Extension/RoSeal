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

export default function ChangeAvatarChatOptIn() {
	const [settings, , , , setSettings] = usePromise(getUserVoiceSettings, []);

	const disabled = settings?.isAvatarVideoOptInDisabled !== false;
	const isUserOptIn = !disabled && settings?.isAvatarVideoOptIn;

	return (
		<Tooltip
			placement="bottom"
			as="li"
			containerId="avatar-chat-opt-in-switcher"
			containerClassName={classNames("navbar-icon-item", {
				"roseal-disabled": disabled,
			})}
			includeContainerClassName={false}
			className="avatar-chat-opt-in-switcher-tooltip"
			button={
				<button
					type="button"
					className="btn-generic-navigation"
					onClick={() => {
						if (disabled) return;

						setUserAvatarChatOptInStatus({
							isUserOptIn: !isUserOptIn,
						}).then(() => {
							setSettings({
								...settings,
								isAvatarVideoOptIn: !isUserOptIn,
							});
						});
					}}
				>
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
