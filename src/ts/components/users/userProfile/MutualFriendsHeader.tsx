import { getUserFriendsLink } from "src/ts/utils/links";
import SocialHeader from "./SocialHeader";
import usePromise from "../../hooks/usePromise";
import { getCanViewUserFriends, getMutualFriends } from "src/ts/utils/friends";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type MutualFriendsHeaderProps = {
	userId: number;
};

export default function MutualFriendsHeader({ userId }: MutualFriendsHeaderProps) {
	const [mutualFriendsCount] = usePromise(
		() => getMutualFriends(userId).then((res) => res.length),
		[userId],
	);
	const [canViewFriends] = usePromise(() => getCanViewUserFriends(userId), [userId]);

	const countDisplay = asLocaleString(mutualFriendsCount || 0);
	return (
		<SocialHeader
			title={getMessage("user.header.social.mutuals", {
				countNum: mutualFriendsCount,
			})}
			alt={getMessage("user.header.social.mutuals.alt", {
				count: countDisplay,
				countNum: mutualFriendsCount,
			})}
			value={countDisplay}
			link={canViewFriends ? getUserFriendsLink(userId, "mutuals") : undefined}
			className="roseal-mutual-friends-count"
		/>
	);
}
