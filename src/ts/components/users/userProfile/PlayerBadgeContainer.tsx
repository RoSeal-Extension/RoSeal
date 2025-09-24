import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import type { BadgeDetails } from "src/ts/helpers/requests/services/badges";
import { getBadgeLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";

export type PlayerBadgeContainerProps = {
	badge: BadgeDetails;
	obtainedDate?: Date;
};

export function PlayerBadgeContainer({ badge, obtainedDate }: PlayerBadgeContainerProps) {
	const formattedTime = obtainedDate && getAbsoluteTime(obtainedDate);

	return (
		<li className="list-item asset-item">
			<a href={getBadgeLink(badge.id, badge.name)} title={badge.displayName}>
				<Thumbnail
					containerClassName="border asset-thumb-container"
					request={{
						type: "BadgeIcon",
						targetId: badge.id,
						size: "150x150",
					}}
				>
					{formattedTime && (
						<div className="xsmall text user-profile-pop-up-text">
							{getMessage("user.experienceBadges.item.obtainedDate", {
								date: formattedTime,
							})}
						</div>
					)}
				</Thumbnail>
				<span className="item-name-container">
					<span className="font-header-2 text-overflow item-name">
						{badge.displayName}
					</span>
				</span>
			</a>
		</li>
	);
}
