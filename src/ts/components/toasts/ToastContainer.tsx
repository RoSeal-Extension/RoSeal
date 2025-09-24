import MdOutlineInfo from "@material-symbols/svg-600/outlined/info-fill.svg";
import MdOutlineError from "@material-symbols/svg-600/outlined/error-fill.svg";
import MdOutlineCheck from "@material-symbols/svg-600/outlined/check-fill.svg";
import MdOutlineWarning from "@material-symbols/svg-600/outlined/warning-fill.svg";
import MdOutlineClose from "@material-symbols/svg-400/outlined/close-fill.svg";

import {
	type CloseButtonProps,
	ToastContainer as ToastifyContainer,
} from "react-toastify/unstyled";

function CloseToastButton({ closeToast }: CloseButtonProps) {
	return (
		<button type="button" className="close-toast-btn roseal-btn">
			<MdOutlineClose className="roseal-icon" onClick={closeToast} />
		</button>
	);
}

export default function ToastContainer() {
	return (
		<ToastifyContainer
			toastClassName="roseal-toast"
			position="bottom-left"
			icon={({ type }) => {
				switch (type) {
					case "info":
						return (
							<MdOutlineInfo className="roseal-icon roseal-info-icon toast-icon" />
						);
					case "error":
						return (
							<MdOutlineError className="roseal-icon roseal-error-icon toast-icon" />
						);
					case "success":
						return (
							<MdOutlineCheck className="roseal-icon roseal-success-icon toast-icon" />
						);
					case "warning":
						return (
							<MdOutlineWarning className="roseal-icon roseal-warning-icon toast-icon" />
						);
					default:
						return null;
				}
			}}
			closeButton={CloseToastButton}
		/>
	);
}
