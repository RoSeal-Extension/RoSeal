import MdOutlineGlobe from "@material-symbols/svg-400/outlined/globe-fill.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import { useServersTabContext } from "./ServersTabProvider";

export default function ServersPromptGeolocation() {
	const { setCalculateServerDistance, setPromptLocationPermission, setUserLatLong } =
		useServersTabContext();

	return (
		<div className="geolocation-permission-prompt prompt-container section-content">
			<div className="prompt-icon">
				<MdOutlineGlobe className="roseal-icon" />
			</div>
			<div className="prompt-text">
				<div className="container-header">
					<h2>{getMessage("experience.servers.locationPermissionPrompt.title")}</h2>
				</div>
				<p>{getMessage("experience.servers.locationPermissionPrompt.message")}</p>
			</div>
			<div className="prompt-buttons">
				<Button
					type="primary"
					onClick={() => {
						navigator.geolocation.getCurrentPosition(
							(position) => {
								setUserLatLong([
									position.coords.latitude,
									position.coords.longitude,
								]);
								setPromptLocationPermission(false);
							},
							() => setCalculateServerDistance([false, "fromAPI"]),
						);
					}}
				>
					{getMessage("experience.servers.locationPermissionPrompt.buttons.allow")}
				</Button>
				<Button
					type="secondary"
					onClick={() => {
						setCalculateServerDistance([false, "fromAPI"]);
					}}
				>
					{getMessage("experience.servers.locationPermissionPrompt.buttons.deny")}
				</Button>
			</div>
		</div>
	);
}
