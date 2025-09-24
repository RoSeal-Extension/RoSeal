import { ROBLOX_BADGES_CONFIG } from "src/ts/constants/profile";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getProfileComponentsData } from "src/ts/helpers/requests/services/misc";
import { getRobloxBadgesInfoLink } from "src/ts/utils/links";
import { crossSort } from "src/ts/utils/objects";
import usePromise from "../../hooks/usePromise";
import { RobloxBadgeContainer } from "./RobloxBadgeContainer";

export type RobloxBadgesContainerProps = {
	userId: number;
};

export default function RobloxBadgesContainer({ userId }: RobloxBadgesContainerProps) {
	const [badges] = usePromise(
		() =>
			getProfileComponentsData({
				profileType: "User",
				profileId: userId.toString(),
				components: [
					{
						component: "RobloxBadges",
					},
				],
			}).then((data) => {
				const list = data.components.RobloxBadges?.robloxBadgeList;
				if (list)
					return crossSort(list, (a, b) => {
						let aPriority = 99;
						let bPriority = 99;
						for (const item of ROBLOX_BADGES_CONFIG) {
							if (a.type.id === item.id) {
								aPriority = item.priority;
							} else if (b.type.id === item.id) {
								bPriority = item.priority;
							}
						}

						return aPriority - bPriority;
					});
			}),
		[userId],
	);

	return (
		badges &&
		badges.length > 0 && (
			<div id="roseal-roblox-badges-container">
				<div className="container-header">
					<h2>{getMessage("user.robloxBadges.title")}</h2>
					<a
						className="btn-fixed-width btn-secondary-xs btn-more see-all-link-icon"
						href={getRobloxBadgesInfoLink()}
					>
						{getMessage("user.robloxBadges.seeMore")}
					</a>
				</div>
				<div className="section-content remove-panel">
					<ul className="hlist badge-list">
						{badges.map((badge) => (
							<RobloxBadgeContainer badge={badge} key={badge.id} />
						))}
					</ul>
				</div>
			</div>
		)
	);
}
