import type { Signal } from "@preact/signals";
import SimpleModal from "../core/modal/SimpleModal";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type PreventLogoutModalProps = {
	data: Signal<{ show: boolean; onLogout?: () => void }>;
};

export default function PreventLogoutModal({ data }: PreventLogoutModalProps) {
	return (
		<SimpleModal
			size="md"
			title={getMessage("acLogoutModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			centerBody
			buttons={[
				{
					type: "neutral",
					text: getMessage("acLogoutModal.neutral"),
					onClick: () => {
						data.value = {
							...data.value,
							show: false,
						};
					},
				},
				{
					type: "action",
					text: getMessage("acLogoutModal.action"),
					onClick: () => {
						data.value.onLogout?.();
						data.value = {
							...data.value,
							show: false,
						};
					},
				},
			]}
			show={data.value.show}
		>
			{getMessage("acLogoutModal.body", {
				bold: (contents: string) => <b>{contents}</b>,
			})}
		</SimpleModal>
	);
}
