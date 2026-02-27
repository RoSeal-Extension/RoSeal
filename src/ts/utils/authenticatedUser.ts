import { watchOnce } from "../helpers/elements.ts";
import { onDOMReady } from "./dom.ts";

export type AuthenticatedUser = {
	userId: number;
	username: string;
	displayName: string;
	isUnder13: boolean;
	created: Date;
	hasPremium: boolean;
	hasVerifiedBadge: boolean;
	hasBlackbird: boolean;
};

const USER_DATA_SELECTOR = 'meta[name="user-data"]';

export function isAuthenticatedSync(): boolean {
	return document.head.querySelector(USER_DATA_SELECTOR) !== null;
}

export function isAuthenticated(): Promise<boolean> {
	return getAuthenticatedUser().then((user) => user !== undefined);
}

export function getAuthenticatedUserSync(
	element?: HTMLElement,
	scope?: Element | Document,
): AuthenticatedUser | undefined {
	const meta =
		element ||
		(scope ?? document.head ?? document.documentElement).querySelector<HTMLMetaElement>(
			USER_DATA_SELECTOR,
		);

	const dataset = meta?.dataset;

	if (dataset) {
		return {
			userId: Number.parseInt(dataset.userid!, 10),
			username: dataset.name!,
			displayName: dataset.displayname!,
			isUnder13: dataset.isunder13?.toLowerCase() === "true",
			created: new Date(dataset.created!),
			hasPremium: dataset.ispremiumuser?.toLowerCase() === "true",
			hasVerifiedBadge: dataset.hasverifiedbadge?.toLowerCase() === "true",
			hasBlackbird: dataset.membership?.toLowerCase() === "blackbird",
		};
	}

	return undefined;
}

export function getAuthenticatedUser(): Promise<AuthenticatedUser | undefined> {
	return new Promise((resolve) => {
		if (document.readyState !== "loading") {
			return resolve(getAuthenticatedUserSync());
		}

		let resolved = false;

		onDOMReady(() => {
			if (resolved) return;

			resolved = true;
			resolve(
				getAuthenticatedUserSync(
					document.head.querySelector<HTMLElement>(USER_DATA_SELECTOR) ?? undefined,
				),
			);
		});

		watchOnce(USER_DATA_SELECTOR).then((el) => {
			if (resolved) return;

			resolved = true;
			resolve(getAuthenticatedUserSync(el));
		});
	});
}
