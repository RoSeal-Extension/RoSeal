import classNames from "classnames";
import type { ComponentChild, ComponentProps } from "preact";
import { Modal, ModalTitle } from "react-bootstrap";
import Icon from "../Icon.tsx";

export type ModalHeaderProps = OmitExtend<
	ComponentProps<Modal["Header"]>,
	{
		title?: ComponentChild;
		subtitle?: ComponentChild;
		showCloseButton?: boolean;
		onClose?: () => void;
		center?: boolean;
		className?: string;
		closeIconName?: string;
	}
>;

export default function ModalHeader({
	subtitle,
	title,
	showCloseButton = true,
	onClose,
	center = true,
	className,
	closeIconName = "close",
	...otherProps
}: ModalHeaderProps) {
	return (
		<Modal.Header
			{...otherProps}
			onHide={onClose}
			className={classNames(className, {
				"text-center": center,
				"has-title": title,
			})}
		>
			{showCloseButton && (
				<button type="button" className="close" onClick={onClose} title="close">
					<Icon name={closeIconName} />
				</button>
			)}
			<ModalTitle>{title}</ModalTitle>
			{subtitle && <span className="text">{subtitle}</span>}
		</Modal.Header>
	);
}
