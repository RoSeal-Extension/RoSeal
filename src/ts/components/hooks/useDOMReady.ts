import { useEffect, useState } from "preact/hooks";
import { onDOMReady } from "src/ts/utils/dom";
import usePromise from "./usePromise";

export default function useDOMReady() {
	const [isReady, setIsReady] = useState(false);
	useEffect(() => {
		onDOMReady(() => setIsReady(true));
	}, []);

	return [isReady];
}
