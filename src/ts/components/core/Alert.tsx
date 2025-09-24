import classNames from "classnames";
import Icon from "./Icon.tsx";
import type { ComponentChildren } from "preact";

export type AlertType = "info" | "loading" | "warning" | "success";

export type AlertProps = {
	show?: boolean;
	className?: string;
	type?: AlertType;
	contentLink?: string;
	showDismiss?: boolean;
	onDismiss?: (e?: MouseEvent) => void;
	children?: ComponentChildren;
};

export default function Alert({
	show,
	className,
	type = "info",
	children,
	contentLink,
	showDismiss,
	onDismiss,
}: AlertProps) {
	return (
		<>
			{show && (
				<div
					className={classNames(`alert alert-${type} roseal-alert`, className)}
					role="alert"
				>
					{contentLink ? (
						<a
							className="text-link alert-link"
							href={`https://${contentLink}`}
							target="_blank"
							rel="noreferrer"
						>
							{children}
						</a>
					) : (
						children
					)}
					{showDismiss && (
						<Icon
							name="close-white"
							role="button"
							tabIndex={-1}
							aria-label="Close"
							onClick={(e) => {
								e.preventDefault();
								onDismiss?.(e);
							}}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									e.preventDefault();
									onDismiss?.();
								}
							}}
						/>
					)}
				</div>
			)}
		</>
	);
}
