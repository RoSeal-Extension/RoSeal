import classNames from "classnames";
import type { ComponentChildren } from "preact";
import { Modal, type ModalProps } from "react-bootstrap";

export type BaseModalProps = OmitExtend<
	ModalProps,
	{
		show?: boolean;
		onHide?: () => void;
		dialogClassName?: string;
		backdropClassName?: string;
		children: ComponentChildren;
	}
>;

export default function BaseModal({
	show = false,
	onHide,
	children,
	dialogClassName,
	backdropClassName,
	...otherProps
}: BaseModalProps) {
	return (
		<Modal
			{...otherProps}
			animation
			show={show}
			onHide={onHide}
			dialogClassName={classNames("roseal-modal modal-modern", dialogClassName)}
			backdropClassName={classNames("roseal-modal-backdrop", backdropClassName)}
		>
			{children}
		</Modal>
	);
}
