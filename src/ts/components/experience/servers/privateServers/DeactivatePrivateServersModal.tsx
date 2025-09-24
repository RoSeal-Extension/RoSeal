import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import FreePrivateServersList from "./FreePrivateServersList";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type DeactivatePrivateServersModalProps = {
	show: boolean;
	setShow: (show: boolean) => void;
};

export default function DeactivatePrivateServersModal({
	show,
	setShow,
}: DeactivatePrivateServersModalProps) {
	return (
		<SimpleModal
			className="roseal-deactivate-private-servers-modal"
			title={getMessage("experience.servers.deactivatePrivateServersModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage(
						"experience.servers.deactivatePrivateServersModal.buttons.neutral",
					),
					onClick: () => {
						setShow(false);
					},
				},
			]}
			show={show}
		>
			{show && <FreePrivateServersList />}
		</SimpleModal>
	);
}
