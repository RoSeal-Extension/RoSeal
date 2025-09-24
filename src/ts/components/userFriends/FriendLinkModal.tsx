import { useState } from "preact/hooks";
import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import useProfileData from "src/ts/components/hooks/useProfileData";
import usePromise from "src/ts/components/hooks/usePromise";
import VerifiedBadge from "src/ts/components/icons/VerifiedBadge";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { FriendInviteData } from "src/ts/helpers/requests/services/sharelinks";
import {
	acceptFriendRequestWithToken,
	getUserById,
	removeTrustedFriend,
} from "src/ts/helpers/requests/services/users";
import { getUserProfileLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";

export type FriendLinkModalProps = FriendInviteData & {
	resolve: () => void;
};

export default function FriendLinkModal({
	status,
	senderUserId: userId,
	friendingToken,
	resolve,
}: FriendLinkModalProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [hasError, setHasError] = useState(false);
	const [loading, setLoading] = useState(false);
	const [accepted, setAccepted] = useState(false);
	const names = useProfileData({
		userId,
	});
	const [hasVerifiedBadge] = usePromise(
		() =>
			getUserById({
				userId,
			}).then((data) => data?.hasVerifiedBadge),
		[userId],
	);

	return (
		<SimpleModal
			show
			title={getMessage("friends.linkModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			centerBody
			closeable={!loading}
			buttons={
				friendingToken.length &&
				!accepted &&
				!hasError &&
				authenticatedUser?.userId !== userId
					? [
							{
								type: "neutral",
								text: getMessage("friends.linkModal.decline"),
								onClick: resolve,
								disabled: loading,
							},
							{
								type: "action",
								text: getMessage("friends.linkModal.accept"),
								loading,
								onClick: () => {
									setLoading(true);
									acceptFriendRequestWithToken({
										userId,
										friendingToken,
									})
										.then(() => {
											setAccepted(true);
											// BUG FIX
											removeTrustedFriend({
												userId,
											});
										})
										.catch(() => setHasError(true))
										.finally(() => setLoading(false));
								},
							},
						]
					: [
							{
								type: "neutral",
								text: getMessage("friends.linkModal.viewProfile"),
								buttonType: "secondary",
								onClick: resolve,
							},
						]
			}
		>
			<div className="friend-invite-modal-body">
				<div className="user-container">
					<a className="avatar avatar-headshot-md" href={getUserProfileLink(userId)}>
						<Thumbnail
							request={{
								type: "AvatarHeadShot",
								targetId: userId,
								size: "150x150",
							}}
							containerClassName="avatar-card-image"
						/>
					</a>
					<div className="user-names">
						<span className="display-name display-name-with-verified-badge text-emphasis">
							<span>{names?.names.combinedName}</span>
							{hasVerifiedBadge && <VerifiedBadge width={16} height={16} />}
						</span>
						<span className="username font-small">@{names?.names.username}</span>
					</div>
				</div>
				<div className="link-status">
					{getMessage(
						`friends.linkModal.body.${
							hasError
								? "error"
								: status === "Valid"
									? authenticatedUser?.userId === userId
										? "myPending"
										: !accepted
											? "pending"
											: "accepted"
									: "used"
						}`,
					)}
				</div>
			</div>
		</SimpleModal>
	);
}
