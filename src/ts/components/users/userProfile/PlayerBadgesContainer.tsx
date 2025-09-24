import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	listUserBadges,
	multigetBadgesAwardedDates,
} from "src/ts/helpers/requests/services/badges";
import { getUserInventoryLink } from "src/ts/utils/links";
import usePromise from "../../hooks/usePromise";
import { PlayerBadgeContainer } from "./PlayerBadgeContainer";

export type PlayerBadgesContainerProps = {
	userId: number;
};

export default function PlayerBadgesContainer({ userId }: PlayerBadgesContainerProps) {
	const [badges] = usePromise(
		() =>
			listUserBadges({
				userId,
				limit: 10,
				sortOrder: "Desc",
			}).then((data) => data.data),
		[userId],
	);
	const [obtainedDates] = usePromise(
		() =>
			badges &&
			multigetBadgesAwardedDates({
				badgeIds: badges.map((badge) => badge.id),
				userId,
			}),
		[userId, badges],
	);

	return (
		badges &&
		badges.length > 0 && (
			<div id="roseal-player-badges-container">
				<div className="container-header">
					<h2>{getMessage("user.experienceBadges.title")}</h2>
					<a
						className="btn-fixed-width btn-secondary-xs btn-more see-all-link-icon"
						href={getUserInventoryLink(userId, "badges")}
					>
						{getMessage("user.experienceBadges.seeAll")}
					</a>
				</div>
				<div className="section-content remove-panel">
					<ul className="hlist badge-list">
						{badges.map((badge) => {
							const obtainedDate = obtainedDates?.find(
								(date) => date.badgeId === badge.id,
							)?.awardedDate;

							return (
								<PlayerBadgeContainer
									key={badge.id}
									badge={badge}
									obtainedDate={obtainedDate ? new Date(obtainedDate) : undefined}
								/>
							);
						})}
					</ul>
				</div>
			</div>
		)
	);
}
