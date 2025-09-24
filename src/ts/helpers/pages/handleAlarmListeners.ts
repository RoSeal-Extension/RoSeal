import type { BackgroundAlarmListener } from "src/types/dataTypes";
import { multigetFeaturesValues } from "../features/helpers";

export function handleAlarmListeners(alarmListeners: BackgroundAlarmListener[]) {
	browser.alarms.onAlarm.addListener((alarm) => {
		for (const listener of alarmListeners) {
			if (alarm.name === listener.action) {
				if (listener.featureIds) {
					multigetFeaturesValues(listener.featureIds).then((value) => {
						for (const key in value) {
							if (value[key as keyof typeof value]) {
								return listener.fn();
							}
						}

						return browser.alarms.clear(alarm.name);
					});
				} else {
					listener.fn();
				}
				return;
			}
		}

		browser.alarms.clear(alarm.name);
	});
}
