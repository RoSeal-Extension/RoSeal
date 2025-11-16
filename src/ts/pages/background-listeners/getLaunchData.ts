import { LAUNCH_DATA_STORAGE_KEY } from "src/ts/constants/misc";
import {
	getRoSealLaunchData,
	type RoSealLaunchData,
} from "src/ts/helpers/requests/services/roseal";
import { storage } from "src/ts/helpers/storage";
import { error } from "src/ts/utils/console";
import type { BackgroundMessageListener } from "src/types/dataTypes";

let launchData: RoSealLaunchData | undefined;

export const launchDataCall =
	import.meta.env.ENV === "background"
		? new Promise<RoSealLaunchData>((resolve) => {
				Promise.all([
					storage.get(LAUNCH_DATA_STORAGE_KEY).then((data) => {
						if (data[LAUNCH_DATA_STORAGE_KEY] && !launchData) {
							if (!launchData) {
								launchData = data[LAUNCH_DATA_STORAGE_KEY];
							}
							return resolve(data[LAUNCH_DATA_STORAGE_KEY]);
						}
					}),
					getRoSealLaunchData()
						.then((data) => {
							if (data) {
								storage.set({ [LAUNCH_DATA_STORAGE_KEY]: data });
								launchData = data;

								return resolve(data);
							}
						})
						.catch((err) => {
							error("Background launch data call failed:", err);
						}),
				]).then(() => {
					if (!launchData) {
						launchData = {};
					}

					resolve({});
				});
			})
		: undefined;

export default {
	action: "getLaunchData",
	fn: () => launchData ?? {},
} satisfies BackgroundMessageListener<"getLaunchData">;
