import type { ListedTestPilotProgram } from "src/ts/helpers/requests/services/account";
import usePromise from "../hooks/usePromise";
import { isProgramSupportedOnDevice } from "./utils/testPilot";
import classNames from "classnames";
import Icon from "../core/Icon";
import { unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import MdOutlineDns from "@material-symbols/svg-400/outlined/dns-fill.svg";
import MdOutlineSportsEsports from "@material-symbols/svg-400/outlined/sports_esports-fill.svg";
import Tooltip from "../core/Tooltip";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";

export type TestPilotProgramProps = {
	program?: ListedTestPilotProgram;
	active: boolean;
	setActive: () => void;
};

export default function TestPilotProgram({ program, active, setActive }: TestPilotProgramProps) {
	const [otherData] = usePromise(
		() =>
			program &&
			isProgramSupportedOnDevice(program).then((value) => {
				let hasClientTreatment = false;
				let hasServerTreatment = false;
				const displayPlatforms: string[] = [];

				for (const platform of program.platforms) {
					if (platform === "PROGRAM_PLATFORM_RCC") {
						hasServerTreatment = true;
					} else {
						hasClientTreatment = true;

						const platformMessageId = `testPilotSettings.item.platforms.${platform}`;
						if (hasMessage(platformMessageId)) {
							displayPlatforms.push(getMessage(platformMessageId));
						}
					}
				}

				return {
					isSupported: value,
					hasClientTreatment,
					hasServerTreatment,
					displayPlatforms: unitListFormat.format(displayPlatforms),
				};
			}),
		[program?.platforms],
	);

	return (
		<li
			className={classNames("test-pilot-program", {
				active,
				"not-supported": otherData?.isSupported === false,
				"border-bottom": program,
			})}
		>
			<button type="button" className="roseal-btn program-btn" onClick={setActive}>
				<div className="program-name-container text-overflow">
					{otherData && (
						<div className="program-platform-icons">
							{otherData.hasServerTreatment && (
								<Tooltip
									includeContainerClassName={false}
									containerClassName="program-platform-icon"
									button={<MdOutlineDns className="roseal-icon" />}
								>
									{getMessage("testPilotSettings.item.icons.server.tooltip")}
								</Tooltip>
							)}
							{otherData.hasClientTreatment && (
								<Tooltip
									includeContainerClassName={false}
									containerClassName="program-platform-icon"
									button={<MdOutlineSportsEsports className="roseal-icon" />}
								>
									{getMessage("testPilotSettings.item.icons.client.tooltip")}
								</Tooltip>
							)}
						</div>
					)}
					<span className="program-name text-overflow">
						{program?.displayName || getMessage("testPilotSettings.item.defaultName")}
					</span>
				</div>
				{otherData?.isSupported === false && (
					<div className="not-supported-text text-alert small">
						<Icon name="warning" />
						<span>{getMessage("testPilotSettings.item.notSupported")}</span>
					</div>
				)}
				{program?.channelName && (
					<div className="channel-name-text">
						{getMessage("testPilotSettings.item.channelName", {
							channelName: program.channelName,
						})}
					</div>
				)}
				{otherData?.displayPlatforms && otherData?.hasClientTreatment && (
					<div className="program-platforms-container text">
						{otherData.displayPlatforms}
					</div>
				)}
				{!otherData && (
					<div className="no-treatments-text text">
						{getMessage("testPilotSettings.item.noAssignedTreatments")}
					</div>
				)}
			</button>
		</li>
	);
}
