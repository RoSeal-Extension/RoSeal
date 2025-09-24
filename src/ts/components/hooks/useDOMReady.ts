import { useEffect, useState } from "preact/hooks";
import usePromise from "./usePromise";
import { onDOMReady } from "src/ts/utils/dom";

export default function useDOMReady() {
	const [isReady, setIsReady] = useState(false);
	useEffect(() => {
		onDOMReady(() => setIsReady(true));
	}, []);

	return [isReady];
}
