import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { multigetLatestAssetsVersions } from "src/ts/helpers/requests/services/assets";
import usePromise from "../hooks/usePromise";

export type ExeprienceDevStatsProps = {
	universeId: number;
	placeId: number;
	viewUniverseId: boolean;
	viewPlaceLatestVersions: boolean;
};

export default function ExperienceDevStats({
	universeId,
	placeId,
	viewUniverseId,
	viewPlaceLatestVersions,
}: ExeprienceDevStatsProps) {
	const [versions] = usePromise(() => {
		if (!viewPlaceLatestVersions) return;

		return Promise.all([
			multigetLatestAssetsVersions({
				assetIds: [placeId],
				versionStatus: "Any",
			}).then((data) => data.results[0].versionNumber),
			multigetLatestAssetsVersions({
				assetIds: [placeId],
				versionStatus: "Published",
			}).then((data) => data.results[0].versionNumber),
		]);
	}, [placeId, viewPlaceLatestVersions]);

	return (
		<>
			{viewUniverseId && (
				<span className="container-header experience-dev-stat">
					<span className="text-label font-caption-header">
						{getMessage("experience.universeId")}
					</span>
					<span className="font-caption-header">{universeId}</span>
				</span>
			)}
			{versions?.[0] !== undefined && (
				<span className="container-header experience-dev-stat">
					<span className="text-label font-caption-header">
						{getMessage("experience.latestSavedVersion")}
					</span>
					<span className="font-caption-header">{asLocaleString(versions[0])}</span>
				</span>
			)}
			{versions?.[1] !== undefined && (
				<span className="container-header experience-dev-stat">
					<span className="text-label font-caption-header">
						{getMessage("experience.latestPublishedVersion")}
					</span>
					<span className="font-caption-header">{asLocaleString(versions[1])}</span>
				</span>
			)}
		</>
	);
}
