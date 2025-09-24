import { useRef, useEffect, type Inputs, type EffectCallback } from "preact/hooks";

export default function useDidMountEffect(func: EffectCallback, deps?: Inputs) {
	const didMount = useRef(false);

	useEffect(() => {
		if (didMount.current) {
			return func();
		}
		didMount.current = true;
	}, deps);
}
