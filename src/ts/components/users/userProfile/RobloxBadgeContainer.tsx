import { useMemo } from "preact/hooks";
import { ROBLOX_BADGES_CONFIG } from "src/ts/constants/profile";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import type { RobloxBadgesProfileComponentBadge } from "src/ts/helpers/requests/services/misc";
import { getRobloxBadgesInfoLink } from "src/ts/utils/links";
import Icon from "../../core/Icon";
import useFeatureValue from "../../hooks/useFeatureValue";

export type RobloxBadgeContainerProps = {
	badge: RobloxBadgesProfileComponentBadge;
};

export function RobloxBadgeContainer({ badge }: RobloxBadgeContainerProps) {
	const [showUniqueId] = useFeatureValue("robloxBadgesObtainedDates.showUniqueIds", false);
	const metadata = useMemo(
		() => ROBLOX_BADGES_CONFIG.find((item) => item.id === badge.type.id),
		[badge.type.id],
	);
	if (!metadata) return null;

	const formattedTime = badge.createdTime && getAbsoluteTime(badge.createdTime.seconds * 1_000);

	return (
		<li className="list-item asset-item">
			<a href={getRobloxBadgesInfoLink(badge.type.id)} title={badge.type.description}>
				<Icon
					name={metadata.iconName}
					className="border asset-thumb-container"
					title={badge.type.value}
				>
					{formattedTime && (
						<div className="xsmall text user-profile-pop-up-text">
							{getMessage("user.robloxBadges.item.obtainedDate", {
								date: formattedTime,
							})}
						</div>
					)}
				</Icon>
				<span className="item-name-container text-overflow">
					<span className="font-header-2 text-overflow item-name">
						{badge.type.value}
					</span>
					{showUniqueId && badge.id !== undefined && (
						<span className="float-right roblox-badge-unique-id xsmall text">
							#{badge.id}
						</span>
					)}
				</span>
			</a>
		</li>
	);
}
