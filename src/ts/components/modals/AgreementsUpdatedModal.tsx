import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SimpleModal from "../core/modal/SimpleModal";
import { useState } from "preact/hooks";
import { getRoSealSiteLink } from "src/ts/utils/links";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type AgreementsUpdatedModalProps = {
	accept: () => void;
};

export default function AgreementsUpdatedModal({ accept }: AgreementsUpdatedModalProps) {
	const [show, setShow] = useState(true);
	const [clickedLink, setClickedLink] = useState(false);

	return (
		<SimpleModal
			id="roseal-agreements-updated-modal"
			size="sm"
			title={getMessage("auModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			closeable={false}
			centerBody
			show={show}
			buttons={[
				{
					type: "action",
					text: getMessage("auModal.action"),
					disabled: !clickedLink,
					onClick: () => {
						accept();
						setShow(false);
					},
				},
			]}
		>
			{getMessage("auModal.body", {
				privacyPolicyLink: (contents: string) => (
					<a
						className="text-link"
						target="_blank"
						rel="noreferrer"
						href={getRoSealSiteLink("privacy-policy")}
						onClick={() => {
							setClickedLink(true);
						}}
					>
						{contents}
					</a>
				),
			})}
		</SimpleModal>
	);
}
