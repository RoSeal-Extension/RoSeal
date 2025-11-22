import { useMemo } from "preact/hooks";
import type { GetUniverseStartInfoResponse } from "src/ts/helpers/requests/services/universes";
import ExperienceField from "../core/items/ExperienceField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { PlaceAvatarSupportType } from "src/ts/helpers/requests/services/avatar";

export type ExperienceAvatarTypeProps = {
	universeStartInfo: GetUniverseStartInfoResponse;
	avatarSupportType: PlaceAvatarSupportType;
};

export default function ExperienceAvatarType({
	universeStartInfo,
	avatarSupportType,
}: ExperienceAvatarTypeProps) {
	const displayAvatarType = useMemo(() => {
		switch (avatarSupportType) {
			case PlaceAvatarSupportType.NoSupport: {
				return "Custom";
			}
			case PlaceAvatarSupportType.UnknownSupport: {
				return "Unknown";
			}
			case PlaceAvatarSupportType.FullSupport: {
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
			}
		}
	}, [universeStartInfo, avatarSupportType]);

	return (
		<ExperienceField title={getMessage("experience.avatarType")} id="experience-avatar-type">
			<p className="text-lead font-caption-body">
				{getMessage(`experience.avatarType.values.${displayAvatarType}`)}
			</p>
		</ExperienceField>
	);
}
