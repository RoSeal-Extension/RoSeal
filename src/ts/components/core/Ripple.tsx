import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { useCallback } from "preact/hooks";

export type RippleEffectProps = {
	children: (
		ripples: JSX.Element[],
		createRipple: (e: MouseEvent, center?: boolean) => void,
	) => JSX.Element;
};

type Ripple = {
	heightWidth: number;
	left: number;
	top: number;
	index: number;
};
export default function RippleEffect(props: RippleEffectProps) {
	const [ripples, setRipples] = useState<Ripple[]>([]);

	const onCreateRipple = useCallback(
		(e: MouseEvent, center?: boolean) => {
			const button = e.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			const diameter = Math.max(button.clientWidth, button.clientHeight);
			const radius = diameter / 2;

			const left = center ? button.clientWidth / 2 - radius : e.clientX - rect.left - radius;

			const top = center ? button.clientHeight / 2 - radius : e.clientY - rect.top - radius;

			const ripple = {
				heightWidth: diameter,
				left,
				top,
				index: (ripples.at(-1)?.index ?? 0) + 1,
			};

			const curr = [...ripples];
			curr.push(ripple);
			setRipples(curr);
		},
		[ripples],
	);

	const onRippleEnd = useCallback(
		(index: number) => {
			const curr = [...ripples];
			curr.splice(index, 1);

			setRipples(curr);
		},
		[ripples],
	);

	return props.children(
		ripples.map((ripple, index) => (
			<span
				key={ripple.index}
				className="roseal-ripple-effect"
				style={{
					height: `${ripple.heightWidth}px`,
					width: `${ripple.heightWidth}px`,
					left: `${ripple.left}px`,
					top: `${ripple.top}px`,
				}}
				onAnimationEnd={() => onRippleEnd(index)}
			/>
		)),
		onCreateRipple,
	);
}
