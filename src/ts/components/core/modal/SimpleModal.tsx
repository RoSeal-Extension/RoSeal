import classNames from "classnames";
import type { ComponentChild, ComponentChildren, VNode } from "preact";
import type { ModalProps } from "react-bootstrap";
import Button, { type ButtonType } from "../Button.tsx";
import Loading from "../Loading.tsx";
import Modal from "./BaseModal.tsx";
import ModalBody from "./Body.tsx";
import ModalFooter from "./Footer.tsx";
import ModalHeader from "./Header.tsx";

export type ModalButtonType = "action" | "neutral";
export type SimpleModalButton = {
	type: ModalButtonType;
	buttonType?: ButtonType;
	disabled?: boolean;
	loading?: boolean;
	visible?: boolean;
	onClick?: () => void;
	text: ComponentChild;
};

export type SimpleModalProps = OmitExtend<
	ModalProps,
	{
		children: ComponentChildren;
		className?: string;
		dialogClassName?: string;
		backdropClassName?: string;
		title?: ComponentChild;
		subtitle?: ComponentChild;
		centerTitle?: boolean;
		body?: VNode | string;
		centerBody?: "flex" | boolean;
		buttons?: SimpleModalButton[];
		footer?: ComponentChild;
		thumbnailImageUrl?: string;
		thumbnail?: ComponentChild;
		show?: boolean;
		onClose?: () => void;
		loading?: boolean;
		closeable?: boolean;
		size?: "sm" | "md" | "lg" | "xl";
		closeIconName?: string;
		fullWidthButtons?: boolean;
	}
>;

export default function SimpleModal({
	className,
	dialogClassName,
	centerTitle = true,
	title,
	subtitle,
	centerBody = false,
	footer,
	thumbnailImageUrl,
	thumbnail,
	show = false,
	onClose,
	loading = false,
	closeable = true,
	closeIconName,
	buttons,
	fullWidthButtons = true,
	children,
	...otherProps
}: SimpleModalProps) {
	const visibleButtons: SimpleModalButton[] = [];
	let onNeutral: (() => void) | undefined;
	if (buttons)
		for (const button of buttons) {
			if (button.visible !== false) {
				visibleButtons.push(button);
				if (button.type === "neutral" && !onNeutral) {
					onNeutral = button.onClick;
				}
			}
		}

	return (
		// @ts-expect-error: Fine, we need to override "size" type
		<Modal
			{...otherProps}
			show={show}
			onHide={onClose ?? onNeutral}
			className={classNames("roseal-modal-container", className)}
			dialogClassName={classNames("modal-window", dialogClassName)}
			keyboard={closeable}
			backdrop={closeable ? true : "static"}
		>
			<ModalHeader
				title={title}
				subtitle={subtitle}
				center={centerTitle}
				closeIconName={closeIconName}
				showCloseButton={closeable}
				onClose={onClose ?? onNeutral}
			/>
			<ModalBody center={centerBody}>
				{children}
				{thumbnailImageUrl && !thumbnail && (
					<div className="img-container modal-image-container">
						<img
							className="modal-thumb"
							src={thumbnailImageUrl}
							alt="Modal Thumbnail"
						/>
					</div>
				)}
				{thumbnail && (
					<div className="img-container modal-image-container">{thumbnail}</div>
				)}
			</ModalBody>
			{(loading || !!buttons?.length || footer) && (
				<ModalFooter>
					{loading && (
						<div className="loading">
							<Loading />
						</div>
					)}
					{!loading && !!buttons?.length && (
						<div
							className={classNames({
								"modal-buttons-with-footer": footer,
								"full-width-modal-buttons":
									fullWidthButtons && buttons.length !== 1,
							})}
						>
							{visibleButtons?.map((button) => (
								<Button
									key={`${button.type}${button.buttonType}`}
									type={
										button.buttonType ||
										(button.type === "action" ? "primary" : "control")
									}
									width={visibleButtons.length === 1 ? "full" : undefined}
									onClick={button.onClick}
									disabled={button.loading || button.disabled}
									className="modal-button"
								>
									{button.loading ? <Loading size="sm" noMargin /> : button.text}
								</Button>
							))}
						</div>
					)}
					{footer && <div className="text-footer modal-footer-center">{footer}</div>}
				</ModalFooter>
			)}
		</Modal>
	);
}
