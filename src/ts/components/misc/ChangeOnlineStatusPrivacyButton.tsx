import MdOutlineGroup from "@material-symbols/svg-400/outlined/group-fill.svg";
import MdOutlineGroups from "@material-symbols/svg-400/outlined/groups-fill.svg";
import MdOutlinePersonAdd from "@material-symbols/svg-400/outlined/person_add-fill.svg";
import MdOutlinePublic from "@material-symbols/svg-400/outlined/public-fill.svg";
import MdOutlineVisibility from "@material-symbols/svg-400/outlined/visibility-fill.svg";
import MdOutlineVisibilityOff from "@material-symbols/svg-400/outlined/visibility_off-fill.svg";
import type { Signal } from "@preact/signals";
import classNames from "classnames";
import type { FunctionComponent, JSX } from "preact";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type DefaultPrivacy,
	type UserSettingsOptions,
	updateUserSettings,
} from "src/ts/helpers/requests/services/account";
import Popover from "../core/Popover";

export type ChangeOnlineStatusPrivacyButtonProps = {
	settings: Signal<UserSettingsOptions | undefined>;
};

type PrivacyLevel = {
	icon: FunctionComponent<JSX.SVGAttributes<SVGElement>>;
	type: DefaultPrivacy;
};

const PRIVACY_LEVELS = [
	{
		icon: MdOutlinePublic,
		type: "AllUsers",
	},
	{
		icon: MdOutlineGroups,
		type: "FriendsFollowingAndFollowers",
	},
	{
		icon: MdOutlineGroup,
		type: "FriendsAndFollowing",
	},
	{
		icon: MdOutlinePersonAdd,
		type: "Friends",
	},
	{
		icon: MdOutlineVisibilityOff,
		type: "NoOne",
	},
] as PrivacyLevel[];

export default function ChangeOnlineStatusPrivacyButton({
	settings,
}: ChangeOnlineStatusPrivacyButtonProps) {
	const settingValue = settings.value?.whoCanSeeMyOnlineStatus?.currentValue;

	const type = useMemo(() => {
		for (const level of PRIVACY_LEVELS) {
			if (settingValue === level.type) {
				return level;
			}
		}

		return PRIVACY_LEVELS.at(-1)!;
	}, [settingValue]);

	if (settings.value && !settings.value.whoCanSeeMyOnlineStatus) return null;

	return (
		<Popover
			trigger="click"
			className="nav-privacy-popover"
			placement="bottom"
			button={
				<li
					id="online-status-privacy-switcher"
					className={classNames("navbar-icon-item", {
						"roseal-disabled": !settingValue,
					})}
				>
					<button type="button" className="btn-generic-navigation">
						<span id="nav-online-status-privacy-icon" className="rbx-menu-item">
							<type.icon className="roseal-icon" />
						</span>
						<MdOutlineVisibility className="rbx-menu-item-corner roseal-icon" />
					</button>
				</li>
			}
		>
			<div className="nav-privacy-popover-content">
				<div className="nav-privacy-popover-header">
					<h3>{getMessage("navigation.onlineStatusPrivacySwitcher.title")}</h3>
					<p>{getMessage("navigation.onlineStatusPrivacySwitcher.description")}</p>
				</div>
				<ul className="nav-privacy-option-list">
					{PRIVACY_LEVELS.map((level) => (
						<li key={level.type} className="privacy-option">
							<button
								className={classNames("roseal-btn privacy-option-btn", {
									selected: settingValue === level.type,
								})}
								type="button"
								onClick={() => {
									if (!settings.value) return;

									updateUserSettings({
										whoCanSeeMyOnlineStatus: level.type,
									}).then(() => {
										settings.value = {
											...settings.value!,
											whoCanSeeMyOnlineStatus: {
												...settings.value!.whoCanSeeMyOnlineStatus!,
												currentValue: level.type,
											},
										};
									});
								}}
							>
								<span className="nav-privacy-popover-icon">
									<level.icon className="roseal-icon" />
								</span>
								<span className="nav-privacy-popover-label">
									{getMessage(
										`navigation.onlineStatusPrivacySwitcher.list.${level.type}`,
									)}
								</span>
							</button>
						</li>
					))}
				</ul>
			</div>
		</Popover>
	);
}
