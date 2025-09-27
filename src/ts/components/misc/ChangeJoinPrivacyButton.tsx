import MdOutlineGroup from "@material-symbols/svg-400/outlined/group-fill.svg";
import MdOutlineGroups from "@material-symbols/svg-400/outlined/groups-fill.svg";
import MdOutlinePersonAdd from "@material-symbols/svg-400/outlined/person_add-fill.svg";
import MdOutlinePlayArrow from "@material-symbols/svg-400/outlined/play_arrow-fill.svg";
import MdOutlinePublic from "@material-symbols/svg-400/outlined/public-fill.svg";
import MdOutlineVisibilityOff from "@material-symbols/svg-400/outlined/visibility_off-fill.svg";
import type { Signal } from "@preact/signals";
import classNames from "classnames";
import type { FunctionComponent, JSX } from "preact";
import { useCallback, useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type DefaultPrivacy,
	type JoinPrivacy,
	type UserSettingsOptions,
	updateUserSettings,
} from "src/ts/helpers/requests/services/account";
import Popover from "../core/Popover";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";

export type ChangeJoinPrivacyButtonProps = {
	settings: Signal<UserSettingsOptions | undefined>;
};

type PrivacyLevel = {
	icon: FunctionComponent<JSX.SVGAttributes<SVGElement>>;
	type: JoinPrivacy;
	statusFilters: DefaultPrivacy[];
};

const PRIVACY_LEVELS = [
	{
		icon: MdOutlinePublic,
		type: "All",
		statusFilters: ["AllUsers"],
	},
	{
		icon: MdOutlineGroups,
		type: "Followers",
		statusFilters: ["AllUsers", "FriendsFollowingAndFollowers"],
	},
	{
		icon: MdOutlineGroup,
		type: "Following",
		statusFilters: ["AllUsers", "FriendsFollowingAndFollowers", "FriendsAndFollowing"],
	},
	{
		icon: MdOutlinePersonAdd,
		type: "Friends",
		statusFilters: [
			"AllUsers",
			"FriendsFollowingAndFollowers",
			"FriendsAndFollowing",
			"Friends",
		],
	},
	{
		icon: MdOutlineVisibilityOff,
		type: "NoOne",
		statusFilters: [
			"AllUsers",
			"FriendsFollowingAndFollowers",
			"FriendsAndFollowing",
			"Friends",
			"NoOne",
		],
	},
] as PrivacyLevel[];

export default function ChangeJoinPrivacyButton({ settings }: ChangeJoinPrivacyButtonProps) {
	const [loading, setLoading] = useState(false);

	const settingValue = settings.value?.whoCanJoinMeInExperiences?.currentValue;
	const onlineStatusSettingValue =
		settings.value?.whoCanSeeMyOnlineStatus?.currentValue ?? "AllUsers";
	const disabled = onlineStatusSettingValue === "NoOne";

	const applicableLevels = useMemo(() => {
		return PRIVACY_LEVELS.filter((level) =>
			level.statusFilters.includes(onlineStatusSettingValue),
		);
	}, [onlineStatusSettingValue]);

	const type = useMemo(() => {
		for (const level of applicableLevels) {
			if (settingValue === level.type) {
				return level;
			}
		}

		return applicableLevels.at(-1)!;
	}, [settingValue, applicableLevels]);

	const onClick = useCallback(
		(type: JoinPrivacy) => {
			if (!settings.value || disabled || loading) return;

			setLoading(true);
			updateUserSettings({
				whoCanJoinMeInExperiences: type,
			})
				.then(() => {
					settings.value = {
						...settings.value!,
						whoCanJoinMeInExperiences: {
							...settings.value!.whoCanJoinMeInExperiences,
							currentValue: type,
						},
					};
				})
				.catch(() =>
					warning(getMessage("navigation.joinPrivacySwitcher.systemFeedback.error")),
				)
				.finally(() => setLoading(false));
		},
		[settings.value, disabled, loading],
	);

	return (
		<Popover
			trigger="click"
			className="nav-privacy-popover"
			placement="bottom"
			button={
				<li
					id="join-privacy-switcher"
					className={classNames("navbar-icon-item", {
						"roseal-disabled": !settingValue || disabled,
					})}
				>
					<button type="button" className="btn-generic-navigation">
						<span id="nav-join-privacy-icon" className="rbx-menu-item">
							<type.icon className="roseal-icon" />
						</span>
						<MdOutlinePlayArrow className="rbx-menu-item-corner roseal-icon" />
					</button>
				</li>
			}
		>
			<div className="nav-privacy-popover-content">
				<div className="nav-privacy-popover-header">
					<h3>{getMessage("navigation.joinPrivacySwitcher.title")}</h3>
					<p>{getMessage("navigation.joinPrivacySwitcher.description")}</p>
				</div>
				<ul
					className={classNames("nav-privacy-option-list", {
						"roseal-disabled": loading,
					})}
				>
					{applicableLevels.map((level) => (
						<li key={level.type} className="privacy-option">
							<button
								className={classNames("roseal-btn privacy-option-btn", {
									selected: settingValue === level.type,
								})}
								type="button"
								onClick={() => onClick(level.type)}
							>
								<span className="nav-privacy-popover-icon">
									<level.icon className="roseal-icon" />
								</span>
								<span className="nav-privacy-popover-label">
									{getMessage(
										`navigation.joinPrivacySwitcher.list.${level.type}`,
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
