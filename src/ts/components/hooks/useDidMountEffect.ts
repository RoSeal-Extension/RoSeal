import { type EffectCallback, type Inputs, useEffect, useRef } from "preact/hooks";

export default function useDidMountEffect(func: EffectCallback, deps?: Inputs) {
	const didMount = useRef(false);

	useEffect(() => {
		if (didMount.current) {
			return func();
		}
		didMount.current = true;
	}, deps);
}
