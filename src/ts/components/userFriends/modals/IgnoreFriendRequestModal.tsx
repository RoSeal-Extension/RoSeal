import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SimpleModal from "../../core/modal/SimpleModal";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { declineAllMyFriendRequests } from "src/ts/helpers/requests/services/users";
import { success } from "../../core/systemFeedback/helpers/globalSystemFeedback";

export type IgnoreAllFriendRequestsModalProps = {
	show: boolean;
	setShow: (value: boolean) => void;
	refresh: () => void;
};

export default function IgnoreAllFriendRequestsModal({
	show,
	setShow,
	refresh,
}: IgnoreAllFriendRequestsModalProps) {
	return (
		<SimpleModal
			show={show}
			className="ignore-requests-modal"
			title={getMessage("friends.friendRequests.ignoreAll.modal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage("friends.friendRequests.ignoreAll.modal.buttons.neutral"),
					onClick: () => setShow(false),
				},
				{
					type: "action",
					text: getMessage("friends.friendRequests.ignoreAll.modal.buttons.action"),
					onClick: () => {
						setShow(false);
						declineAllMyFriendRequests().then((data) => {
							if (data.backgrounded) {
								success(
									getMessage(
										"friends.friendRequests.ignoreAll.modal.backgroundedMessage",
									),
								);
							} else {
								refresh();
							}
						});
					},
				},
			]}
		>
			<p>{getMessage("friends.friendRequests.ignoreAll.modal.body")}</p>
		</SimpleModal>
	);
}
