import MdOutlineComputer from "@material-symbols/svg-400/outlined/computer.svg";
import MdOutlineHMD from "@material-symbols/svg-400/outlined/head_mounted_device.svg";
import MdOutlineSmartphone from "@material-symbols/svg-400/outlined/mobile.svg";
import MdOutlineConsole from "@material-symbols/svg-400/outlined/sports_esports.svg";
import MdOutlineTablet from "@material-symbols/svg-400/outlined/tablet.svg";
import type { JSX } from "preact/jsx-runtime";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUniversePlayableDevices } from "src/ts/utils/joinData";
import ExperienceField from "../core/items/ExperienceField";
import Tooltip from "../core/Tooltip";
import usePromise from "../hooks/usePromise";

export type ExperiencePlayableDevicesProps = {
	universeId: number;
};

export default function ExperiencePlayableDevices({ universeId }: ExperiencePlayableDevicesProps) {
	const [deviceTypes] = usePromise(() => getUniversePlayableDevices(universeId), [universeId]);
	const icons = deviceTypes?.map((deviceType) => {
		let icon: JSX.Element;
		switch (deviceType) {
			case "Desktop": {
				icon = <MdOutlineComputer className="roseal-icon" />;
				break;
			}
			case "Phone": {
				icon = <MdOutlineSmartphone className="roseal-icon" />;
				break;
			}
			case "Tablet": {
				icon = <MdOutlineTablet className="roseal-icon" />;
				break;
			}
			case "Console": {
				icon = <MdOutlineConsole className="roseal-icon" />;
				break;
			}
			case "VR": {
				icon = <MdOutlineHMD className="roseal-icon" />;
				break;
			}
		}

		if (!icon) return null;

		return (
			<Tooltip
				button={icon}
				containerClassName="playable-device-item"
				as="div"
				includeContainerClassName={false}
			>
				{getMessage(`deviceTypes.${deviceType}`)}
			</Tooltip>
		);
	});

	if (!icons?.length) {
		return null;
	}

	return (
		<ExperienceField title={getMessage("experience.supportedDevices")} id="playable-devices">
			<p className="playable-devices-list">{icons}</p>
		</ExperienceField>
	);
}
