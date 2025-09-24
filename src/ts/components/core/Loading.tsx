import classNames from "classnames";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

export type LoadingSize = "default" | "sm" | "xs";

export type LoadingProps = {
	size?: LoadingSize;
	className?: string;
	noMargin?: boolean;
	children?: ComponentChildren;
};

export default function Loading({ size = "default", className, noMargin }: LoadingProps) {
	return (
		<span
			className={classNames(className, "spinner", {
				[`spinner-${size}`]: size,
				"spinner-no-margin": noMargin,
			})}
		/>
	);
}
