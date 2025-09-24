import { createSystemFeedback } from "../utils/createSystemFeedback.tsx";
import { renderAsContainer } from "src/ts/utils/render.ts";

let service: ReturnType<typeof createSystemFeedback>[1] | undefined;
export function createGlobalSystemFeedback(): void {
	if (service) return;

	const [SystemFeedback, systemFeedbackService] = createSystemFeedback();
	const systemFeedbackDiv = document.createElement("div");

	const pageContent = document.body?.querySelector(".content");

	if (pageContent) {
		pageContent.before(systemFeedbackDiv);
		renderAsContainer(<SystemFeedback />, systemFeedbackDiv);

		service = systemFeedbackService;
	}
}

export function success(message: string, timeoutShow?: number, timeoutHide?: number): void {
	if (!service) createGlobalSystemFeedback();

	service?.success(message, timeoutShow, timeoutHide);
}

export function warning(message: string, timeoutShow?: number, timeoutHide?: number): void {
	if (!service) createGlobalSystemFeedback();

	service?.warning(message, timeoutShow, timeoutHide);
}

export function info(message: string, timeoutShow?: number, timeoutHide?: number): void {
	if (!service) createGlobalSystemFeedback();

	service?.info(message, timeoutShow, timeoutHide);
}

export function loading(message: string, timeoutShow?: number, timeoutHide?: number): void {
	if (!service) createGlobalSystemFeedback();

	service?.loading(message, timeoutShow, timeoutHide);
}
