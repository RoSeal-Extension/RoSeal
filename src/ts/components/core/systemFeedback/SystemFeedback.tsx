import classNames from "classnames";
import Alert, { type AlertType } from "../Alert.tsx";

export type SystemFeedbackProps = {
	children?: string;
	bannerType?: AlertType;
	showBanner?: boolean;
	showCloseButton?: boolean;
	onDismiss?: (e?: MouseEvent) => void;
};

export default function SystemFeedback({
	children,
	bannerType = "success",
	showBanner = false,
	showCloseButton = false,
	onDismiss,
}: SystemFeedbackProps) {
	return (
		<div className="sg-system-feedback">
			<div className="alert-system-feedback">
				<Alert
					show
					className={classNames("system-feedback", {
						on: showBanner,
					})}
					showDismiss={showCloseButton}
					onDismiss={onDismiss}
					type={bannerType}
				>
					<span className="alert-content">{children}</span>
				</Alert>
			</div>
		</div>
	);
}
