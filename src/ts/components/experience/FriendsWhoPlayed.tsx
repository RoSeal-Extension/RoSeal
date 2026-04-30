import { listUserFriendsWhoPlayed } from "src/ts/helpers/requests/services/users";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { useState } from "preact/hooks";

import SimpleModal from "../core/modal/SimpleModal";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import FriendWhoPlayedItem from "./FriendWhoPlayedItem";

export type FriendsWhoPlayedGameProps = {
	universeId: number;
};

export default function FriendsWhoPlayedGame({ universeId }: FriendsWhoPlayedGameProps) {
	const [showModal, setShowModal] = useState(false);
	const [modalShownOnce, setModalShownOnce] = useState(false);

	const [authenticatedUser] = useAuthenticatedUser();
	const [friendsWhoPlayed] = usePromise(() => {
		if (!authenticatedUser) return;

		return listUserFriendsWhoPlayed({
			userId: authenticatedUser.userId,
			universeId,
		});
	}, [authenticatedUser?.userId, universeId]);

	if (!friendsWhoPlayed?.data.length) return null;

	return (
		<div id="friends-who-played-container">
			<button
				type="button"
				className="game-friends-social-count roseal-btn"
				onClick={() => {
					setShowModal(true);
					setModalShownOnce(true);
				}}
			>
				<div className="count-text">
					{getMessage("experience.friendsPlayed.buttonText", {
						count: asLocaleString(friendsWhoPlayed.data.length),
						countNum: friendsWhoPlayed.data.length,
					})}
				</div>
			</button>
			<SimpleModal
				title={getMessage("experience.friendsPlayed.modal.title", {
					sealEmoji: SEAL_EMOJI_COMPONENT,
					count: asLocaleString(friendsWhoPlayed.data.length),
					countNum: friendsWhoPlayed.data.length,
				})}
				onClose={() => setShowModal(false)}
				className="friends-played-modal roseal-scrollbar"
				size="sm"
				show={showModal}
			>
				<ul className="friend-list">
					{modalShownOnce &&
						friendsWhoPlayed.data.map((friend) => (
							<FriendWhoPlayedItem key={friend.friendUserId} friend={friend} />
						))}
				</ul>
			</SimpleModal>
		</div>
	);
}
