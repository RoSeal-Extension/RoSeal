import type { Signal } from "@preact/signals";
import { useState } from "preact/hooks";
import CheckboxField from "src/ts/components/core/CheckboxField";
import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ConfirmUnfriendModalProps = {
	show: Signal<boolean>;
	onClickAction: (stop?: boolean) => void;
	onClickNeutral: () => void;
};

export default function ConfirmUnfriendModal({
	show,
	onClickAction,
	onClickNeutral,
}: ConfirmUnfriendModalProps) {
	const [disableFeature, setDisableFeature] = useState(false);

	return (
		<SimpleModal
			title={getMessage("user.confirmRemoveConnectionModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage("user.confirmRemoveConnectionModal.buttons.neutral"),
					onClick: onClickNeutral,
				},
				{
					type: "action",
					text: getMessage("user.confirmRemoveConnectionModal.buttons.action"),
					onClick: () => onClickAction(disableFeature),
				},
			]}
			show={show.value}
		>
			<p>{getMessage("user.confirmRemoveConnectionModal.body.text")}</p>
			<CheckboxField checked={disableFeature} onChange={setDisableFeature}>
				<label className="checkbox-label text-label">
					{getMessage("user.confirmRemoveConnectionModal.body.checkbox")}
				</label>
			</CheckboxField>
		</SimpleModal>
	);
}
