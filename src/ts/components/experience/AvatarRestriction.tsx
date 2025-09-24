import { useMemo } from "preact/hooks";
import Icon from "src/ts/components/core/Icon.tsx";
import Tooltip from "src/ts/components/core/Tooltip.tsx";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import type { GetUniverseStartInfoResponse } from "src/ts/helpers/requests/services/universes.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { clamp } from "src/ts/utils/misc.ts";
import type {
	AvatarScales,
	AvatarType,
	UserAvatar,
} from "src/ts/helpers/requests/services/avatar.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";

export type ExperienceAvatarRestrictionProps = {
	universeStartInfo: GetUniverseStartInfoResponse;
	userAvatar: UserAvatar;
};

export default function ExperienceAvatarRestriction({
	universeStartInfo,
	userAvatar,
}: ExperienceAvatarRestrictionProps) {
	const [enableWarning] = useFeatureValue("viewExperienceAvatarType.showAvatarRestricted", true);
	const restrictions = useMemo(() => {
		let avatarTypeRestricted = false;
		let tooBig = false;
		const scalesRestricted: Exclude<keyof AvatarScales, "depth">[] = [];

		if (
			universeStartInfo.gameAvatarType !== "PlayerChoice" &&
			universeStartInfo.gameAvatarType !== `MorphTo${userAvatar.playerAvatarType}`
		)
			avatarTypeRestricted = true;

		for (const [key, value] of Object.entries(userAvatar.scales)) {
			const min = universeStartInfo.universeAvatarMinScales[key as keyof AvatarScales];
			const max = universeStartInfo.universeAvatarMaxScales[key as keyof AvatarScales];
			if (key !== "depth" && clamp(value, min, max) !== value) {
				if (scalesRestricted.length === 0 && value > max) {
					tooBig = true;
				}
				scalesRestricted.push(key as (typeof scalesRestricted)[number]);
			}
		}

		return {
			avatarType: avatarTypeRestricted,
			scales: scalesRestricted,
			isRestricted: avatarTypeRestricted || scalesRestricted.length !== 0,
			tooBig,
			restrictionCount: scalesRestricted.length + (avatarTypeRestricted ? 1 : 0),
		};
	}, [universeStartInfo, userAvatar]);

	return (
		<>
			{restrictions.isRestricted && enableWarning && (
				<Tooltip
					as="div"
					includeContainerClassName={false}
					button={
						<div className="text small text-center avatar-restriction-warning">
							<Icon name="moreinfo" size="16x16" addSizeClass />
							<span className="avatar-restriction-text">
								{getMessage(
									`experience.avatarRestricted.${restrictions.avatarType ? (`avatarType.${userAvatar.playerAvatarType}` as const) : (`scales.${restrictions.scales[0]}` as const)}`,
									{
										hasMore: restrictions.restrictionCount > 1,
										moreCount: asLocaleString(
											restrictions.restrictionCount - 1,
										),
										tooBig: restrictions.tooBig,
										more: (contents: string) => (
											<span className="restricted-count">{contents}</span>
										),
									},
								)}
							</span>
						</div>
					}
					containerClassName="avatar-restriction-container"
					className="avatar-restriction-tooltip"
				>
					<table className="table table-striped">
						<thead>
							<tr>
								<th className="text-label">
									{getMessage("experience.avatarRestrictedTooltip.field")}
								</th>
								<th className="text-label">
									{getMessage("experience.avatarRestrictedTooltip.you")}
								</th>
								<th className="text-label">
									{getMessage("experience.avatarRestrictedTooltip.experience")}
								</th>
							</tr>
						</thead>
						<tbody>
							{restrictions.avatarType && (
								<tr>
									<td>
										{getMessage(
											"experience.avatarRestrictedTooltip.fields.avatarType",
										)}
									</td>
									<td className="text-error">
										{getMessage(
											`experience.avatarRestrictedTooltip.fields.avatarType.values.${userAvatar.playerAvatarType}`,
										)}
									</td>
									<td>
										{getMessage(
											`experience.avatarRestrictedTooltip.fields.avatarType.values.${
												universeStartInfo.gameAvatarType.split(
													"MorphTo",
												)[1] as AvatarType
											}`,
										)}
									</td>
								</tr>
							)}
							{restrictions.scales.map((scale) => {
								const userScale = userAvatar.scales[scale];
								const minScale = universeStartInfo.universeAvatarMinScales[scale];
								const maxScale = universeStartInfo.universeAvatarMaxScales[scale];

								return (
									<tr key={scale}>
										<td>
											{getMessage(
												`experience.avatarRestrictedTooltip.fields.${scale}`,
											)}
										</td>
										<td className="text-error">
											{asLocaleString(userScale, {
												style: "percent",
											})}
										</td>
										<td>
											{minScale === maxScale
												? asLocaleString(minScale, {
														style: "percent",
													})
												: getMessage(
														"experience.avatarRestrictedTooltip.percentRange",
														{
															minPercentage: asLocaleString(
																minScale,
																{
																	style: "percent",
																},
															),
															maxPercentage: asLocaleString(
																maxScale,
																{
																	style: "percent",
																},
															),
														},
													)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</Tooltip>
			)}
		</>
	);
}
