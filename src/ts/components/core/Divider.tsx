import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type DividerProps = {
	as?: keyof JSX.IntrinsicElements;
	thick?: boolean;
};

export default function Divider({ as: Element = "li", thick }: DividerProps) {
	return (
		<Element
			className={classNames("rbx-divider", {
				"thick-height": thick,
			})}
		/>
	);
}
