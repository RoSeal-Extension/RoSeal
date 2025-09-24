import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	blockUser,
	removeTrustedFriend,
	unfollowUser,
	unfriendUser,
} from "src/ts/helpers/requests/services/users";
import { removeFollower } from "src/ts/utils/users";
import ItemContextMenu from "../core/ItemContextMenu";
import { success, warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import usePromise from "../hooks/usePromise";
import type { FriendsTabType } from "./Page";

export type FriendCardContextMenuProps = {
	isMyProfile?: boolean;
	userId: number;
	tabId: FriendsTabType;
	isFriends: MaybePromise<boolean | undefined>;
	isDeleted: MaybePromise<boolean | undefined>;
	hideCard: (addToHidden?: boolean) => void;
	showOtherOptions?: boolean;
	showGetFriendDate?: boolean;
	onClickGetFriendDate?: () => void;
};

export default function FriendCardContextMenu({
	userId,
	tabId,
	isMyProfile,
	isFriends: _isFriends,
	isDeleted: _isDeleted,
	showOtherOptions,
	showGetFriendDate,
	onClickGetFriendDate,
	hideCard,
}: FriendCardContextMenuProps) {
	const [isFriends] = usePromise(() => _isFriends, [userId]);
	const [isDeleted] = usePromise(() => _isDeleted, [userId]);

	const showGenericError = () => warning(getMessage("friends.actions.error.generic"));

	return (
		<ItemContextMenu containerClassName="avatar-card-menu" wrapChildren={false}>
			{isFriends && tabId === "trusted-friends" && !isDeleted && (
				<li>
					<button
						type="button"
						onClick={() =>
							removeTrustedFriend({ userId })
								.then(() => {
									hideCard();
									success(
										getMessage("friends.actions.success.removeTrustedFriend"),
									);
								})
								.catch(showGenericError)
						}
					>
						{getMessage("friends.actions.removeTrustedFriend")}
					</button>
				</li>
			)}
			{isFriends &&
				((tabId !== "trusted-friends" && !isDeleted) || isDeleted || showOtherOptions) && (
					<li>
						<button
							type="button"
							onClick={() =>
								unfriendUser({ userId })
									.then(() => {
										hideCard();
										success(getMessage("friends.actions.success.unfriend"));
									})
									.catch(showGenericError)
							}
						>
							{getMessage("friends.actions.unfriend")}
						</button>
					</li>
				)}
			{tabId === "following" && (
				<li>
					<button
						type="button"
						onClick={() =>
							unfollowUser({ userId })
								.then(() => {
									hideCard();
									success(getMessage("friends.actions.success.unfollow"));
								})
								.catch(showGenericError)
						}
					>
						{getMessage("friends.actions.unfollow")}
					</button>
				</li>
			)}
			{tabId === "followers" && (!isFriends || isDeleted) && showOtherOptions && (
				<li>
					<button
						type="button"
						onClick={() =>
							removeFollower(userId).then((success) => success && hideCard(true))
						}
					>
						{getMessage("friends.actions.removeFollower")}
					</button>
				</li>
			)}
			{isMyProfile && (
				<li>
					<button
						type="button"
						onClick={() =>
							blockUser({ userId })
								.then(() => {
									hideCard(true);
									success(getMessage("friends.actions.success.block"));
								})
								.catch(showGenericError)
						}
					>
						{getMessage("friends.actions.block")}
					</button>
				</li>
			)}
			{(tabId === "friends" || tabId === "trusted-friends") && showGetFriendDate && (
				<li>
					<button type="button" onClick={onClickGetFriendDate}>
						{getMessage("friends.actions.getFriendDate")}
					</button>
				</li>
			)}
		</ItemContextMenu>
	);
}
