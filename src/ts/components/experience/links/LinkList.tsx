import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { getRoSealExperienceLinks } from "src/ts/helpers/requests/services/roseal.ts";
import Loading from "../../core/Loading.tsx";
import useFeatureValue from "../../hooks/useFeatureValue.ts";
import usePromise from "../../hooks/usePromise.ts";
import ExperienceLinkItem from "./Link.tsx";

export type ExperienceLinksProps = {
	universeId: number;
};

export default function ExperienceLinks({ universeId }: ExperienceLinksProps) {
	const [shouldUseFandomMirror] = useFeatureValue("experienceLinks.useFandomMirror", false);
	const [experienceLinks, fetched] = usePromise(
		() =>
			getRoSealExperienceLinks({
				universeId,
			}),
		[universeId],
	);

	if (!experienceLinks) {
		if (!fetched) {
			return <Loading />;
		}

		return null;
	}

	return (
		<div className="experience-links-section">
			{experienceLinks.links.length > 1 ||
				(experienceLinks.links[0].type !== "communityWiki" && (
					<div className="container-header">
						<h2>{getMessage("experience.links.title")}</h2>
					</div>
				))}
			<ul className="experience-links-container stack-list">
				{experienceLinks.links.map((link) => (
					<ExperienceLinkItem
						key={link.type}
						link={link}
						shouldUseFandomMirror={shouldUseFandomMirror}
					/>
				))}
			</ul>
		</div>
	);
}
