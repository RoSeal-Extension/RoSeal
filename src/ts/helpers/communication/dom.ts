import type { Env } from "scripts/build/constants.ts";
import type {
	CommunicationResponseMessage,
	DOMCommunicationInvokeDataTypes as InvokeDataTypes,
	DOMCommunicationMessageDataTypes as MessageDataTypes,
} from "src/types/dataTypes";
import { watchOnce } from "../elements";

export type EventData<
	T extends keyof MessageDataTypes = keyof MessageDataTypes,
	U extends MessageDataTypes[T]["args"] = MessageDataTypes[T]["args"],
> = {
	type: string;
	details: {
		action: T;
		args: U;
		origin: Env;
	};
};

export type MessageListener<
	T extends keyof MessageDataTypes = keyof MessageDataTypes,
	U extends MessageDataTypes[T]["args"] = MessageDataTypes[T]["args"],
> = {
	action: T;
	callback: (args: U, target?: MessageTarget) => MaybePromise<void>;
};

export type InvokeCallback<
	T extends keyof InvokeDataTypes = keyof InvokeDataTypes,
	U extends InvokeDataTypes[T]["args"] = InvokeDataTypes[T]["args"],
	V extends InvokeDataTypes[T]["res"]["data"] = InvokeDataTypes[T]["res"]["data"],
> = (args: U, target?: MessageTarget) => MaybePromise<V>;

export type InvokeData<
	T extends keyof InvokeDataTypes = keyof InvokeDataTypes,
	U extends InvokeDataTypes[T]["args"] = InvokeDataTypes[T]["args"],
> = {
	id: string;
	action: T;
	args: U;
};

// Message listeners.
const messageListeners = new Set<MessageListener>();
// Queue for messages that haven't been handled yet.
const messageQueue = new Set<[EventData, MessageTarget?]>();

// Queue for invokes that haven't been handled yet.
const messageInvokeQueue: Record<string, [InvokeData, MessageTarget?][]> = {};
// Callback handlers for invokes
const messageInvokeHandlers: Record<string, InvokeCallback> = {};
// Unresolved invokes.
const messageInvokeUnresolvedQueue: Record<string, (args: unknown) => void> = {};

export type MessageTarget = {
	window: MessageEventSource;
	url: string;
};

const onLoaded =
	import.meta.env.ENV === "main" || import.meta.env.ENV === "inject"
		? watchOnce(
				`meta[name="roseal-script-loaded"]:not([data-script-env=${import.meta.env.ENV}])`,
			)
		: undefined;

export function sendMessage<
	T extends keyof MessageDataTypes,
	U extends MessageDataTypes[T]["args"],
>(action: T, args: U, target?: MessageTarget): void {
	if (!onLoaded) {
		(target?.window ?? window).postMessage(
			{
				type: "rosealCommunication",
				details: {
					action,
					args,
					origin: import.meta.env.ENV,
				},
			},
			{
				targetOrigin: target?.url,
			},
		);
	} else {
		onLoaded.then(() =>
			(target?.window ?? window).postMessage(
				{
					type: "rosealCommunication",
					details: {
						action,
						args,
						origin: import.meta.env.ENV,
					},
				},
				{
					targetOrigin: target?.url,
				},
			),
		);
	}
}

if (import.meta.env.ENV !== "background") {
	if (onLoaded) {
		const el = document.createElement("meta");
		el.setAttribute("name", "roseal-script-loaded");
		el.setAttribute("data-script-env", import.meta.env.ENV);
		document.documentElement.appendChild(el);
	}

	globalThis.addEventListener("message", ({ data, source, origin }: MessageEvent<EventData>) => {
		if (
			typeof data === "object" &&
			"type" in data &&
			data.type === "rosealCommunication" &&
			"details" in data
		) {
			if (data.details.origin === import.meta.env.ENV) return;

			let hasListener = false;
			for (const listener of messageListeners) {
				if (listener.action === data.details.action) {
					hasListener = true;
					listener.callback(
						data.details.args,
						source
							? {
									window: source,
									url: origin,
								}
							: undefined,
					);
				}
			}

			if (!hasListener) {
				messageQueue.add([data, source ? { window: source, url: origin } : undefined]);
			}
		}
	});
}

export function addMessageListener<
	T extends keyof MessageDataTypes,
	U extends MessageDataTypes[T]["args"],
>(action: T, callback: (args: U, target?: MessageTarget) => MaybePromise<void>) {
	const listener = {
		action,
		callback,
	} as MessageListener;
	messageListeners.add(listener);

	for (const items of messageQueue) {
		const [item, target] = items;
		if (item.details.action === action) {
			callback(item.details.args as U, target);
			messageQueue.delete(items);
		}
	}

	return () => {
		messageListeners.delete(listener);
	};
}

if (import.meta.env.ENV !== "background")
	addMessageListener("invokeResponse", (args) => {
		if (args.id in messageInvokeUnresolvedQueue) {
			messageInvokeUnresolvedQueue[args.id](args.args);

			delete messageInvokeUnresolvedQueue[args.id];
		}
	});

export function invokeMessage<
	T extends keyof InvokeDataTypes,
	U extends InvokeDataTypes[T]["args"],
	V extends InvokeDataTypes[T]["res"],
>(action: T, args: U, target?: MessageTarget): Promise<V["data"]> {
	const id = crypto.randomUUID();

	sendMessage(
		"invoke",
		{
			id,
			action,
			args,
		},
		target,
	);

	let resolvePromise: (args: CommunicationResponseMessage<V["data"], V["reason"]>) => void;
	const promise = new Promise<V["data"]>((resolve, reject) => {
		resolvePromise = (args) => {
			if (args.success) {
				resolve(args.data);
			} else {
				reject(args.reason);
			}
		};
	});

	messageInvokeUnresolvedQueue[id] = (args) =>
		resolvePromise(args as CommunicationResponseMessage<V["data"], V["reason"]>);
	return promise;
}

export function setInvokeListener<T extends keyof InvokeDataTypes>(
	action: T,
	callback: InvokeCallback<T>,
) {
	messageInvokeHandlers[action] = callback;

	const actionInvokeQueue = messageInvokeQueue[action];
	if (actionInvokeQueue?.length > 0) {
		for (const invoke of actionInvokeQueue) {
			handleMessageInvoke(...invoke);
		}

		delete messageInvokeQueue[action];
	}
}

async function handleMessageInvoke<T extends keyof InvokeDataTypes>(
	args: InvokeData<T>,
	target?: MessageTarget,
) {
	let response = messageInvokeHandlers[args.action](args.args);

	try {
		if (response instanceof Promise) response = await response;

		sendMessage(
			"invokeResponse",
			{
				id: args.id,
				action: args.action,
				args: {
					success: true,
					data: response,
				},
			},
			target,
		);
	} catch (err) {
		sendMessage(
			"invokeResponse",
			{
				id: args.id,
				action: args.action,
				args: {
					success: false,
					reason: typeof err === "string" ? err : "UnknownError",
				},
			},
			target,
		);
	}
}

if (import.meta.env.ENV !== "background")
	addMessageListener("invoke", (args, target) => {
		if (args.action in messageInvokeHandlers) {
			handleMessageInvoke(args, target);
		} else {
			messageInvokeQueue[args.action] ??= [];
			messageInvokeQueue[args.action].push([args, target]);
		}
	});
