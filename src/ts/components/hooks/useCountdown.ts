import { useEffect, useState } from "preact/hooks";
import { getFormattedDuration } from "../utils/getFormattedDuration";

export default function useCountdown(toDate?: Date | null, onEnd?: () => void) {
	const [state, setState] = useState<[string, boolean]>(["...", !toDate]);

	useEffect(() => {
		if (!toDate) {
			return setState(["...", false]);
		}
		const calculateTime = () => {
			const theDate = new Date();
			if (toDate.getTime() - theDate.getTime() < 1000) {
				setState(["...", true]);
				onEnd?.();
				return clearTimeout(timer);
			}

			setState([getFormattedDuration(theDate, toDate), false]);
		};
		const timer = setInterval(calculateTime, 1_000);
		calculateTime();

		return () => clearInterval(timer);
	}, [toDate?.getTime()]);

	return state;
}
