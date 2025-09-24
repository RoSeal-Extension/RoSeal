import { signal } from "@preact/signals";
import SimpleModal from "../SimpleModal.tsx";
import type { SimpleModalProps } from "../SimpleModal.tsx";

export function createModal(onShow?: () => void, onHide?: () => void) {
	const state = signal(false);

	state.subscribe((value) => {
		if (value) {
			onShow?.();
		} else {
			onHide?.();
		}
	});
	return [
		({ children, onClose, ...otherProps }: SimpleModalProps) => {
			return (
				<SimpleModal
					{...otherProps}
					show={state.value}
					onClose={() => {
						state.value = false;
						onClose?.();
					}}
				>
					{children}
				</SimpleModal>
			);
		},
		{
			show: () => {
				state.value = true;
			},
			hide: () => {
				state.value = false;
			},
		},
	] as const;
}
