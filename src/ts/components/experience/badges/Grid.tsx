import { useMemo } from "preact/hooks";
import type { BadgesListProps } from "./List";
import GridBadge from "./GridBadge";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function BadgesGrid({
	items,
	user1,
	user2,
	user1Id,
	user2Id,
	isComparison,
}: BadgesListProps) {
	const [obtained, unobtained] = useMemo(() => {
		const obtained = [];
		const unobtained = [];
		for (const badge of items) {
			const el = (
				<GridBadge
					key={badge.id}
					badge={badge}
					user1={user1?.find((item) => item.badgeId === badge.id)}
					user2={user2?.find((item) => item.badgeId === badge.id)}
					user1Id={user1Id}
					user2Id={user2Id}
					isComparison={isComparison}
				/>
			);
			if (
				user1?.find((item) => item.badgeId === badge.id) ||
				user2?.find((item) => item.badgeId === badge.id)
			) {
				obtained.push(el);
			} else {
				unobtained.push(el);
			}
		}
		return [obtained, unobtained];
	}, [items, user1, user2, isComparison]);

	return (
		<div className="new-badges-grids-container">
			{obtained.length !== 0 && (
				<div className="new-badges-grid-container section">
					<div className="container-header">
						<h2>{getMessage("experience.badges.grid.obtained")}</h2>
					</div>
					<ul className="new-badges-grid">{obtained}</ul>
				</div>
			)}
			{unobtained.length !== 0 && (
				<div className="new-badges-grid-container section">
					<div className="container-header">
						<h2>{getMessage("experience.badges.grid.unobtained")}</h2>
					</div>
					<ul className="new-badges-grid">{unobtained}</ul>
				</div>
			)}
		</div>
	);
}
