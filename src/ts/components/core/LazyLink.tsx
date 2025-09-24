import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

export type LazyLinkProps = JSX.IntrinsicElements["a"];

export default function LazyLink({ target, href, children, ...props }: LazyLinkProps) {
	const [clicked, setClicked] = useState(false);

	useEffect(() => {
		if (clicked && href) {
			globalThis.open(href.toString(), target?.toString());
			setClicked(false);
		}
	}, [href, clicked]);

	return (
		<a
			{...{
				...props,
				target,
				onClick: !href ? () => setClicked(true) : undefined,
				href: href || undefined,
			}}
		>
			{children}
		</a>
	);
}
