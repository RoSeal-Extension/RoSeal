import type { BadgeAwardedDate, BadgeDetails } from "src/ts/helpers/requests/services/badges";
import ListBadge from "./ListBadge";

export type BadgesListProps = {
	items: BadgeDetails[];
	isComparison: boolean;
	user1?: BadgeAwardedDate[];
	user1Username?: string;
	user1Id?: number;
	user2?: BadgeAwardedDate[];
	user2Id?: number;
};

export default function BadgesList({
	items,
	user1,
	user1Username,
	user2,
	isComparison,
	user1Id,
	user2Id,
}: BadgesListProps) {
	return (
		<ul className="new-badges-list">
			{items.map((badge) => (
				<ListBadge
					key={badge.id}
					badge={badge}
					user1={user1?.find((item) => item.badgeId === badge.id)}
					user1Username={user1Username}
					user2={user2?.find((item) => item.badgeId === badge.id)}
					user1Id={user1Id}
					user2Id={user2Id}
					isComparison={isComparison}
				/>
			))}
		</ul>
	);
}
