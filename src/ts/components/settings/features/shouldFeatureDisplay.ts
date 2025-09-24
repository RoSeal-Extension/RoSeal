import type { Feature } from "src/ts/helpers/features/featuresData";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleLowerCase } from "src/ts/helpers/i18n/intlFormats";

export function shouldFeatureDisplay(feature: Feature, keyword: string) {
	if (!keyword) {
		return true;
	}

	const nameKey = `features.${feature.id}.name`;
	const descriptionKey = `features.${feature.id}.description`;

	const name = hasMessage(nameKey) ? getMessage(nameKey) : undefined;
	const description = hasMessage(descriptionKey) ? getMessage(descriptionKey) : undefined;

	const localeKeyword = asLocaleLowerCase(keyword);
	if (
		feature.id.toLowerCase().includes(asLocaleLowerCase(keyword)) ||
		feature.subfeatures?.items.some((feature) => shouldFeatureDisplay(feature, keyword)) ||
		(name && asLocaleLowerCase(name).includes(localeKeyword)) ||
		(description && asLocaleLowerCase(description).includes(localeKeyword))
	) {
		return true;
	}

	return false;
}
