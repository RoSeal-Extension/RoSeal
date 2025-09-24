export function formatMessage(messageType: string, color: string, args: unknown[]) {
	const firstArg = args.shift();

	return [
		`%c[%cRo%cSeal %c${
			import.meta.env.IS_DEV ? "development" : "production"
		}%c: %c${messageType}%c]%c ${firstArg}`,
		"color:gray",
		"color:revert",
		"color:#4a4ec4",
		"color:pink",
		"color:gray",
		`color:${color}`,
		"color:gray",
		"color:revert",
		...args,
	];
}

export function info(...args: unknown[]) {
	return console.info(...formatMessage("info", "cornflowerblue", args));
}

export function warn(...args: unknown[]) {
	return console.warn(...formatMessage("warn", "yellow", args));
}

export function log(...args: unknown[]) {
	return console.log(...formatMessage("log", "white", args));
}

export function error(...args: unknown[]) {
	return console.error(...formatMessage("error", "red", args));
}
