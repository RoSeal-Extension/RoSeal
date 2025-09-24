import type { ComponentChildren } from "preact";
import { ModalBody as BSModalBody } from "react-bootstrap";

export type ModalBodyProps = {
	center?: boolean | "flex";
	children?: ComponentChildren;
};

export default function ModalBody({ children, center, ...otherProps }: ModalBodyProps) {
	return (
		<BSModalBody {...otherProps}>
			{center ? (
				<div className={center === "flex" ? "flex-center" : "text-center"}>{children}</div>
			) : (
				children
			)}
		</BSModalBody>
	);
}
