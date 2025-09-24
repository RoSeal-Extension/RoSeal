import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { regionNamesFormat, unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import { getExperienceDetailedGuidelines } from "src/ts/helpers/requests/services/universes";
import Icon from "../core/Icon";
import Tooltip from "../core/Tooltip";
import usePromise from "../hooks/usePromise";

export type ExperienceRestrictedCountriesProps = {
	universeId: number;
};

export default function ExperienceRestrictedCountries({
	universeId,
}: ExperienceRestrictedCountriesProps) {
	const [restrictedCountries] = usePromise(
		() =>
			getExperienceDetailedGuidelines({
				universeId,
			}).then((data) =>
				data.restrictedCountries.map((country) => {
					let minAge: number | undefined;
					let maxAge: number | undefined;
					let ageDisplayName = "";

					for (const usage of country.experienceDescriptorUsages) {
						if (!usage.ageRange) {
							continue;
						}

						if (!minAge || usage.ageRange.minAgeInclusive > minAge) {
							minAge = usage.ageRange.minAgeInclusive;
						}

						if (!maxAge || usage.ageRange.maxAgeInclusive < maxAge) {
							maxAge = usage.ageRange.maxAgeInclusive;
						}

						if (usage.ageRangeDisplayName) {
							ageDisplayName = usage.ageRangeDisplayName;
						}
					}

					return {
						...country,
						minAge,
						maxAge,
						ageDisplayName,
					};
				}),
			),
		[universeId],
	);

	if (!restrictedCountries?.length) {
		return null;
	}

	return (
		<span className="restricted-countries-text text">
			{getMessage("experience.restrictedCountries.label", {
				questionMarkTooltip: (
					<Tooltip button={<Icon name="moreinfo" size="16x16" />}>
						{unitListFormat.format(
							restrictedCountries.map((country) => {
								const name =
									regionNamesFormat.of(country.countryCode) ??
									country.countryCode;

								const { minAge, maxAge, ageDisplayName } = country;
								return maxAge !== undefined && minAge !== undefined
									? getMessage("experience.restrictedCountries.item.withAge", {
											country: name,
											ageDisplayName,
										})
									: name;
							}),
						)}
					</Tooltip>
				),
			})}
		</span>
	);
}
