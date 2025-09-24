import { useEffect, useState } from "preact/hooks";
import type { RefObject } from "preact";

export function useIntersection(
	element: RefObject<HTMLElement>,
	once?: boolean,
	rootMargin?: string,
) {
	const [isVisible, setVisible] = useState(false);

	useEffect(() => {
		if (!element.current) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (once && isVisible) return;

				setVisible(entry.isIntersecting);
				if (once) {
					observer.disconnect();
				}
			},
			{ rootMargin },
		);

		observer.observe(element.current);

		return () => {
			observer.disconnect();
		};
	}, [element.current]);

	return isVisible;
}
