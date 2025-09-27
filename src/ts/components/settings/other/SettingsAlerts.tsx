import { FEATURE_STORAGE_KEY } from "src/ts/helpers/features/constants";
import usePromise from "../../hooks/usePromise";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import MdOutlineError from "@material-symbols/svg-400/outlined/error-fill.svg";

export default function SettingsAlerts() {
	const [storageAccessible] = usePromise(
		() =>
			browser.storage.local
				.get(FEATURE_STORAGE_KEY)
				.then(() => true)
				.catch(() => false),
		[],
	);

	if (storageAccessible !== false) return null;

	return (
		<div className="settings-alert section-content">
			<div className="alert-icon">
				<MdOutlineError className="roseal-icon" />
			</div>
			<div className="alert-text">
				<div className="container-header">
					<h2>{getMessage("settings.storageUnavailable.title")}</h2>
				</div>
				<p>{getMessage("settings.storageUnavailable.message")}</p>
			</div>
		</div>
	);
}
