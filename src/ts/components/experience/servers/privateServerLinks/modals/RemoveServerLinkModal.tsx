import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type RemoveServerLinkModalProps = {
	show: boolean;
	hide: () => void;
	remove: () => void;
};

export default function RemoveServerLinkModal({ show, hide, remove }: RemoveServerLinkModalProps) {
	return (
		<SimpleModal
			show={show}
			centerTitle
			dialogClassName="remove-server-link-modal"
			title={getMessage("experience.privateServerLinks.removePrivateServerModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			centerBody
			buttons={[
				{
					type: "neutral",
					text: getMessage(
						"experience.privateServerLinks.removePrivateServerModal.actions.neutral",
					),
					onClick: hide,
				},
				{
					type: "action",
					text: getMessage(
						"experience.privateServerLinks.removePrivateServerModal.actions.action",
					),
					buttonType: "alert",
					onClick: remove,
				},
			]}
		>
			{getMessage("experience.privateServerLinks.removePrivateServerModal.body")}
		</SimpleModal>
	);
}
