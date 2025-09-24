import type { Signal } from "@preact/signals";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage.ts";
import type { Section, Subsection } from "../../../helpers/features/featuresData.ts";
import FeatureContainer from "./FeatureContainer.tsx";
import { shouldFeatureDisplay } from "./shouldFeatureDisplay.ts";

export type FeatureSectionProps = {
	section: Section;
	keyword: Signal<string>;
};

export function shouldFeaturesSubsectionDisplay(subsection: Subsection, keyword: string) {
	if (!keyword) {
		return true;
	}

	return subsection.features.some((feature) => shouldFeatureDisplay(feature, keyword));
}

export function shouldFeaturesSectionDisplay(section: Section, keyword: string) {
	if (!keyword) {
		return true;
	}

	return section.subsections.some((subsection) =>
		shouldFeaturesSubsectionDisplay(subsection, keyword),
	);
}

export default function FeatureSection({ section, keyword }: FeatureSectionProps) {
	const sectionDescriptionKey = `featureSections.${section.id}.description`;

	return (
		<div className="section feature-section">
			{hasMessage(sectionDescriptionKey) && (
				<p className="section-description">{getMessage(sectionDescriptionKey)}</p>
			)}
			{section.subsections.map((subsection) => {
				const sectionTitleKey = `featureSections.${section.id}.${subsection.id}.title`;
				const sectionDescriptionKey = `featureSections.${section.id}.${subsection.id}.description`;

				if (!shouldFeaturesSubsectionDisplay(subsection, keyword.value)) {
					return;
				}

				return (
					<div className="section feature-subsection" key={subsection.id}>
						{
							<h3>
								{hasMessage(sectionTitleKey)
									? getMessage(sectionTitleKey)
									: subsection.id}
							</h3>
						}
						{hasMessage(sectionDescriptionKey) && (
							<p className="section-description">
								{getMessage(sectionDescriptionKey)}
							</p>
						)}

						{subsection.features.map(
							(feature) =>
								shouldFeatureDisplay(feature, keyword.value) && (
									<FeatureContainer
										key={feature.id}
										feature={feature}
										keyword={keyword}
									/>
								),
						)}
					</div>
				);
			})}
		</div>
	);
}
