import { type Dispatch, useCallback, useRef, useState } from "preact/hooks";

type ReadOnlyRefObject<T> = {
	readonly current: T;
};

type UseStateRef = {
	<S>(initialState: S | (() => S)): [S, Dispatch<S>, ReadOnlyRefObject<S>];
	<S = undefined>(): [S | undefined, Dispatch<S | undefined>, ReadOnlyRefObject<S | undefined>];
};

const useStateRef: UseStateRef = <S>(initialState?: S | (() => S)) => {
	const [state, setState] = useState(initialState);
	const ref = useRef(state);

	const dispatch: typeof setState = useCallback((setStateAction: unknown) => {
		ref.current =
			typeof setStateAction === "function" ? setStateAction(ref.current) : setStateAction;

		setState(ref.current);
	}, []);

	return [state, dispatch, ref];
};

export default useStateRef;
