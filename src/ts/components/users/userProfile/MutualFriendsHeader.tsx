import { getUserFriendsLink } from "src/ts/utils/links";
import SocialHeader from "./SocialHeader";
import usePromise from "../../hooks/usePromise";
import { getCanViewUserFriends, getMutualFriends } from "src/ts/utils/friends";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SocialHeaderV2 from "./SocialHeaderV2";

export type MutualFriendsHeaderProps = {
	userId: number;
	useV2?: boolean;
};

export default function MutualFriendsHeader({ userId, useV2 }: MutualFriendsHeaderProps) {
	const [mutualFriendsCount] = usePromise(
		() => getMutualFriends(userId).then((res) => res.length),
		[userId],
	);
	const [canViewFriends] = usePromise(() => getCanViewUserFriends(userId), [userId]);

	const countDisplay = asLocaleString(mutualFriendsCount || 0);
	const Component = useV2 ? SocialHeaderV2 : SocialHeader;

	return (
		<Component
			title={getMessage("user.header.social.mutuals", {
				countNum: mutualFriendsCount,
			})}
			alt={getMessage("user.header.social.mutuals.alt", {
				count: countDisplay,
				countNum: mutualFriendsCount,
			})}
			value={countDisplay}
			link={
				canViewFriends && (!useV2 || mutualFriendsCount)
					? getUserFriendsLink(userId, "mutuals")
					: undefined
			}
			className="roseal-mutual-friends-count"
		/>
	);
}
