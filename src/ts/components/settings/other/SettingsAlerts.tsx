import { FEATURE_STORAGE_KEY } from "src/ts/helpers/features/constants";
import usePromise from "../../hooks/usePromise";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import MdOutlineError from "@material-symbols/svg-400/outlined/error-fill.svg";
import useHasPermissions from "../../hooks/useHasPermissions";
import { getRoSealUrl } from "src/ts/utils/baseUrls";
import { useEffect, useState } from "preact/hooks";
import { initialLaunchDataFetch } from "src/ts/utils/interastral";

export default function SettingsAlerts() {
	const [storageAccessible] = usePromise(
		() =>
			browser.storage.local
				.get(FEATURE_STORAGE_KEY)
				.then(() => true)
				.catch(() => false),
		[],
	);
	const rosealSiteAccessible = useHasPermissions(
		{
			origins: [`*://${getRoSealUrl("*", "/*")}`],
		},
		true,
	);

	const [featuresLoaded, setFeaturesLoaded] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		let loaded = false;
		initialLaunchDataFetch.then(() => {
			loaded = true;
		});

		const timeout = setTimeout(() => {
			if (!loaded) {
				setFeaturesLoaded(false);
			}
		}, 1_500);

		return () => clearTimeout(timeout);
	}, []);

	let alertCase: "storageUnavailable" | "rosealPermissionRequired" | "otherReason" | undefined;

	if (storageAccessible === false) {
		alertCase = "storageUnavailable";
	} else if (!rosealSiteAccessible) {
		alertCase = "rosealPermissionRequired";
	} else if (featuresLoaded === false) {
		alertCase = "otherReason";
	}

	if (alertCase) {
		return (
			<div className="settings-alert section-content">
				<div className="alert-icon">
					<MdOutlineError className="roseal-icon" />
				</div>
				<div className="alert-text">
					<div className="container-header">
						<h2>{getMessage(`settings.alerts.${alertCase}.title`)}</h2>
					</div>
					<p>{getMessage(`settings.alerts.${alertCase}.message`)}</p>
				</div>
			</div>
		);
	}
}
