import { PLAYER_REFERRAL_LOCALSTORAGE_KEY } from "../constants/misc";

export function getUserAccountIdBTID() {
	const match = document.cookie.match(/rbxid=(\d+)(.*browserid=(\d+))?/);
	if (match) {
		return [
			Number.parseInt(match[1], 10),
			match[3] ? Number.parseInt(match[3], 10) : undefined,
		];
	}
}

export function getUserReferralPlayerId(placeId: number): number | undefined {
	const refInfo = window.localStorage.getItem(PLAYER_REFERRAL_LOCALSTORAGE_KEY);
	if (refInfo) {
		try {
			const userId = JSON.parse(atob(refInfo))?.[placeId];
			window.localStorage.removeItem(PLAYER_REFERRAL_LOCALSTORAGE_KEY);

			return userId;
		} catch {
			return undefined;
		}
	}
}
