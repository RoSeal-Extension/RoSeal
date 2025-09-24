import { useEffect, useState } from "preact/hooks";
import { presenceProcessor } from "src/ts/helpers/processors/presenceProcessor";
import type { UserPresence } from "src/ts/helpers/requests/services/users";

export default function usePresence(userId?: number, defaultPresence?: UserPresence) {
	const [presence, setPresence] = useState(defaultPresence);

	useEffect(() => {
		if (defaultPresence) {
			return setPresence(defaultPresence);
		}

		if (!userId) {
			return setPresence(undefined);
		}
		presenceProcessor
			.request({
				userId,
			})
			.then(setPresence);

		return presenceProcessor.onChanged(
			{
				userId,
			},
			(presence) => {
				setPresence(presence);
			},
		);
	}, [defaultPresence, userId]);

	return presence;
}
