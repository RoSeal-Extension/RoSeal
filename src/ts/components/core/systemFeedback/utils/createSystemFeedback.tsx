import { signal } from "@preact/signals";
import type { AlertType } from "../../Alert.tsx";
import SystemFeedback, { type SystemFeedbackProps } from "../SystemFeedback.tsx";

export type ModalService = Record<
	AlertType,
	(text: string, timeoutShow?: number, timeoutHide?: number) => void
>;

export type FeedbackState = {
	show: boolean;
	text?: string;
	type?: AlertType;
	showCloseButton?: boolean;
	timeoutShow?: number;
	timeoutHide?: number;
};

export function createSystemFeedback(): [typeof SystemFeedback, ModalService] {
	const state = signal<FeedbackState>({
		show: false,
		showCloseButton: false,
	});

	let timeoutShow: Timer | undefined;
	let timeoutHide: Timer | undefined;

	const show = (
		text: string,
		type: AlertType = "info",
		overrideTimeoutShow = 200,
		overrideTimeoutHide = 1000 + 500 * text.split(/(\s+)/).length,
	) => {
		if (timeoutShow) {
			clearTimeout(timeoutShow);
		}
		if (timeoutHide) {
			clearTimeout(timeoutHide);
		}

		timeoutShow = setTimeout(() => {
			state.value = {
				...state.value,
				show: true,
				text,
				type,
				showCloseButton: type === "warning",
			};

			if (type !== "warning")
				timeoutHide = setTimeout(() => {
					state.value = {
						...state.value,
						show: false,
					};
				}, overrideTimeoutHide);
		}, overrideTimeoutShow);
	};

	return [
		(props: SystemFeedbackProps) => {
			return (
				<SystemFeedback
					{...props}
					showBanner={state.value.show}
					showCloseButton={state.value.showCloseButton}
					onDismiss={() => {
						state.value = {
							...state.value,
							show: false,
						};
						props.onDismiss?.();
					}}
					bannerType={state.value.type}
				>
					{state.value.text}
				</SystemFeedback>
			);
		},
		{
			success: (text, timeoutShow, timeoutHide) => {
				show(text, "success", timeoutShow, timeoutHide);
			},
			info: (text, timeoutShow, timeoutHide) => {
				show(text, "info", timeoutShow, timeoutHide);
			},
			loading: (text, timeoutShow, timeoutHide) => {
				show(text, "loading", timeoutShow, timeoutHide);
			},
			warning: (text, timeoutShow, timeoutHide) => {
				show(text, "warning", timeoutShow, timeoutHide);
			},
		},
	];
}
