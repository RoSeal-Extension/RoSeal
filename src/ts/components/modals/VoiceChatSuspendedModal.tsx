import { useState } from "preact/hooks";
import SimpleModal from "../core/modal/SimpleModal.tsx";
import { getRobloxCommunityStandardsLink, getRobloxSettingsLink } from "../../utils/links.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats.ts";
import type { GetUserVoiceSettingsResponse } from "src/ts/helpers/requests/services/voice.ts";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact.tsx";

export type VoiceChatSuspendedModalProps = {
	data: GetUserVoiceSettingsResponse;
	hide: () => void;
};

export default function VoiceChatSuspendedModal({ data, hide }: VoiceChatSuspendedModalProps) {
	const [show, setShow] = useState(true);

	return (
		<SimpleModal
			show={show}
			size="md"
			centerTitle
			title={
				<div>
					<div className="icon-warning-orange" />
					<div className="h4">
						{getMessage("vcSuspensionModal.title", {
							sealEmoji: SEAL_EMOJI_COMPONENT,
						})}
					</div>
				</div>
			}
			centerBody
			closeable={false}
			className="vc-suspended-modal"
			buttons={[
				{
					type: "action",
					text: getMessage("vcSuspensionModal.action"),
					onClick: () => {
						setShow(false);
						hide();
					},
				},
			]}
		>
			{getMessage("vcSuspensionModal.description", {
				emphasis: (contents: string) => <span className="text-emphasis">{contents}</span>,
				date: getAbsoluteTime(new Date(data.bannedUntil!.Seconds * 1000)),
				privacySettingsLink: (contents: string) => (
					<a
						href={getRobloxSettingsLink("privacy")}
						className="text-link"
						target="_blank"
						rel="noreferrer"
					>
						{contents}
					</a>
				),
				communityStandardsLink: (contents: string) => (
					<a
						href={getRobloxCommunityStandardsLink()}
						className="text-link"
						target="_blank"
						rel="noreferrer"
					>
						{contents}
					</a>
				),
			})}
		</SimpleModal>
	);
}
