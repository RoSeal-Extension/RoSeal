import messages from "#i18n";
import type messagesType from "#i18n/types";
import { IntlMessageFormat } from "intl-messageformat";
import { CUSTOM_I18N_OVERRIDE_LOCALSESSIONSTORAGE_KEY } from "../../constants/i18n.ts";
import { setInvokeListener } from "../communication/dom.ts";
import { getLocalSessionStorage } from "../storage.ts";
import { asLocaleString } from "./intlFormats.ts";
import { locales } from "./locales.ts";
import { error } from "src/ts/utils/console.ts";

const customI18nOverride = getLocalSessionStorage<Record<string, string>>(
	CUSTOM_I18N_OVERRIDE_LOCALSESSIONSTORAGE_KEY,
);

export function getMessage<T extends keyof typeof messagesType>(
	messageName: T,
	values?: (typeof messagesType)[T],
	defaultMessage?: string,
): string {
	let messageString: string | undefined;
	try {
		for (const locale of locales) {
			if (customI18nOverride?.[messageName]) {
				messageString = customI18nOverride[messageName];
				break;
			}

			if (messages[messageName]?.[locale]) {
				messageString = messages[messageName]?.[locale];
				break;
			}
		}
	} catch {
		if (defaultMessage) {
			error(`Failed to format ${defaultMessage} with ${values} params`);
			messageString = defaultMessage;
		} else {
			error(`Failed to get message key ${messageName}`);
			return messageName;
		}
	}

	if (!messageString?.length) {
		if (defaultMessage) {
			messageString = defaultMessage;
		} else {
			return messageName;
		}
	}
	if (!values) return messageString;

	return formatCustomMessage(messageString, values);
}

if (import.meta.env.ENV === "main") {
	setInvokeListener("getMessage", (args) => {
		if (args.value)
			for (const key in args.value) args.value[key] = asLocaleString(args.value[key]);

		// @ts-expect-error: fix later
		return getMessage(args.messageName, args.value);
	});

	setInvokeListener("getMessages", (args) => {
		const messages: string[] = [];
		for (const item of args.messageNames) {
			messages.push(getMessage(item));
		}

		return messages;
	});
}

export function hasMessage(messageName: string): messageName is keyof typeof messagesType {
	return messageName in messages;
}

export function formatCustomMessage(
	messageString: string,
	values: Record<string, unknown>,
): string {
	try {
		const message = new IntlMessageFormat(messageString, locales);
		return message.format(values) as string;
	} catch (err) {
		error(`Failed to format ${messageString}:`, err);
		return messageString;
	}
}

export function getMessageKeysWithPrefix(prefix: string) {
	const keys = [];
	for (const key in messages) {
		if (key.startsWith(prefix)) {
			keys.push(key);
		}
	}

	return keys as (keyof typeof messagesType)[];
}
