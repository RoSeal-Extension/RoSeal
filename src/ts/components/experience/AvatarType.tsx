import { useMemo } from "preact/hooks";
import type { GetUniverseStartInfoResponse } from "src/ts/helpers/requests/services/universes";
import ExperienceField from "../core/items/ExperienceField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ExperienceAvatarTypeProps = {
	universeStartInfo: GetUniverseStartInfoResponse;
};

export default function ExperienceAvatarType({ universeStartInfo }: ExperienceAvatarTypeProps) {
	const displayAvatarType = useMemo(() => {
		if (universeStartInfo.gameAvatarType === "MorphToR15") {
			if (universeStartInfo.universeAvatarMaxScales.bodyType === 1) {
				if (universeStartInfo.universeAvatarMinScales.bodyType === 1) {
					return "ForcedRthro";
				}

				return "R15Rthro";
			}

			return "R15";
		}
		if (universeStartInfo.gameAvatarType === "MorphToR6") {
			return "R6";
		}

		return "UserChoice";
	}, [universeStartInfo]);

	return (
		<ExperienceField title={getMessage("experience.avatarType")} id="experience-avatar-type">
			<p className="text-lead font-caption-body">
				{getMessage(`experience.avatarType.values.${displayAvatarType}`)}
			</p>
		</ExperienceField>
	);
}
