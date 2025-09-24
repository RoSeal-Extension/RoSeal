import type { Feature } from "src/ts/helpers/features/featuresData";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Tooltip from "../../core/Tooltip";

export type FeatureTypeLabelProps = {
	feature: Feature;
};

export function FeatureTypeLabel({ feature }: FeatureTypeLabelProps) {
	return (
		<>
			{feature.type !== "Regular" && (
				<Tooltip
					button={
						<span
							className={`roseal-feature-type-label roseal-${feature.type.toLowerCase()}-feature-label`}
						>
							{getMessage(
								`settings.features.labels.${
									feature.type.toLowerCase() as "experimental" | "beta"
								}`,
							)}
						</span>
					}
					includeContainerClassName={false}
				>
					{getMessage(
						`settings.features.labels.${
							feature.type.toLowerCase() as "experimental" | "beta"
						}.tooltip`,
					)}
				</Tooltip>
			)}
		</>
	);
}
