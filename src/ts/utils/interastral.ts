import { invokeMessage } from "../helpers/communication/background";
import type { RoSealLaunchData } from "../helpers/requests/services/roseal";
import { launchDataCall } from "../pages/background-listeners/getLaunchData";

export function getLaunchData(): Promise<RoSealLaunchData> {
	if (import.meta.env.ENV === "main") {
		return invokeMessage("getLaunchData", undefined).catch(() => ({}));
	}

	return launchDataCall!;
}

export let launchData: RoSealLaunchData | undefined;
export const initialLaunchDataFetch = getLaunchData()
	.then((data) => {
		launchData = data;
		return data;
	})
	.catch(() => {});
