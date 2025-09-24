import MdOutlineFastForward from "@material-symbols/svg-400/outlined/fast_forward-fill.svg";
import MdOutlineSyncProblem from "@material-symbols/svg-400/outlined/sync_problem-fill.svg";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getRobloxSupportUrl } from "src/ts/utils/links";
import { useServersTabContext } from "./ServersTabProvider";

export default function ChannelVersionWarning() {
	const { userChannelVersion, productionVersion } = useServersTabContext();
	const [title, message, type] = useMemo(() => {
		if (!userChannelVersion || !productionVersion || userChannelVersion === productionVersion)
			return [];

		const channelDiff = Math.abs(userChannelVersion - productionVersion);

		if (userChannelVersion > productionVersion) {
			if (channelDiff > 1) {
				return [
					getMessage("experience.servers.versionWarning.development.title"),
					getMessage("experience.servers.versionWarning.development.message"),
					"development",
				] as const;
			}

			return [
				getMessage("experience.servers.versionWarning.prerelease.title"),
				getMessage("experience.servers.versionWarning.prerelease.message"),
				"prerelease",
			] as const;
		}

		if (channelDiff > 1) {
			return [
				getMessage("experience.servers.versionWarning.veryOutdated.title"),
				getMessage("experience.servers.versionWarning.veryOutdated.message", {
					lineBreak: <br />,
					robloxSupportLink: (contents: string) => (
						<a className="text-link" href={getRobloxSupportUrl()}>
							{contents}
						</a>
					),
				}),
				"veryOutdated",
			] as const;
		}

		return [
			getMessage("experience.servers.versionWarning.outdated.title"),
			getMessage("experience.servers.versionWarning.outdated.message"),
			"outdated",
		] as const;
	}, [userChannelVersion, productionVersion]);

	if (!title || !message || !type) return null;

	return (
		<div className="channel-version-warning prompt-container section-content">
			<div className="prompt-icon">
				{(type === "development" || type === "prerelease") && (
					<MdOutlineFastForward className="roseal-icon" />
				)}
				{(type === "outdated" || type === "veryOutdated") && (
					<MdOutlineSyncProblem className="roseal-icon" />
				)}
			</div>
			<div className="prompt-text">
				<div className="container-header">
					<h2>{title}</h2>
				</div>
				<p>{message}</p>
			</div>
		</div>
	);
}
