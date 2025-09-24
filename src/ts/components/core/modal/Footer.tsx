import type { ComponentChildren } from "preact";
import { ModalFooter as BSModalFooter } from "react-bootstrap";

export type ModalFooterProps = {
	children?: ComponentChildren;
};

export default function ModalFooter({ children, ...otherProps }: ModalFooterProps) {
	return <BSModalFooter {...otherProps}>{children}</BSModalFooter>;
}
