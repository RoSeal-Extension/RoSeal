import { type Inputs, useEffect, useRef } from "preact/hooks";

export default function useEffectOnce(fn: () => boolean | undefined, inputs: Inputs) {
	const didOnce = useRef(false);

	useEffect(() => {
		if (didOnce.current) {
			return;
		}

		if (fn()) {
			didOnce.current = true;
		}
	}, inputs);
}
