import type messagesType from "#i18n/types";
import type { ParsedChallenge } from "parse-roblox-errors";
import type { Challenge2SV } from "./challenges/challengesInject";
import { invokeMessage } from "./communication/dom";

export function renderGenericChallenge(args: ParsedChallenge) {
	return invokeMessage("renderGenericChallenge", args).then((data) => data?.data);
}

export function blankInjectCall<T>(fn: string[], args?: unknown[]): Promise<T> {
	return invokeMessage("blankCall", {
		fn,
		args,
	}) as Promise<T>;
}

export function render2SVChallenge(args: Challenge2SV) {
	return invokeMessage("render2SVChallenge", args).then((data) => data?.data);
}

export function getLangNamespace<T extends Record<string, string>>(namespace: string) {
	return invokeMessage("getLangNamespace", namespace) as Promise<T>;
}

export function blankInjectGet<T = unknown>(target: string[]): Promise<T> {
	return invokeMessage("blankGet", {
		target,
	}) as Promise<T>;
}

export function getMessageInject<T extends keyof typeof messagesType>(
	messageName: T,
	value?: (typeof messagesType)[T],
): Promise<string> {
	return invokeMessage("getMessage", {
		messageName,
		// @ts-expect-error: fix later, do not care
		value,
	});
}

export function getMessagesInject<T extends keyof typeof messagesType>(
	messageNames: T[],
): Promise<string[]> {
	return invokeMessage("getMessages", {
		messageNames,
	});
}

export function isMasterTab() {
	return invokeMessage("isMasterTab", undefined);
}
