import MdOutlineMenuBook from "@material-symbols/svg-400/outlined/menu_book.svg";
import { useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { getRoSealExperienceLinks } from "src/ts/helpers/requests/services/roseal.ts";
import { locales } from "src/ts/helpers/i18n/locales.ts";
import Button from "../core/Button";
import Loading from "../core/Loading.tsx";
import ThirdPartyLinkModal from "../core/ThirdPartyLinkModal.tsx";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import usePromise from "../hooks/usePromise.ts";
import { languageNamesFormat } from "src/ts/helpers/i18n/intlFormats.ts";

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
				{experienceLinks.links.map((link) => {
					const [showModal, setShowModal] = useState(false);
					const setLink = useMemo(() => {
						if (link.type === "communityWiki" && shouldUseFandomMirror) {
							return `https://${link.url.replace("fandom.com", "breezewiki.com")}`;
						}

						return `https://${link.url}`;
					}, [link.url, link.type, shouldUseFandomMirror]);
					const isSameLocale = locales[0].split("-")[0] === link.locale;

					const messagePrefix =
						`experience.links.${link.type}.${link.isOfficialWiki ? "official" : "unofficial"}` as const;

					return (
						<li className="experience-link-container" key={link.type}>
							<ThirdPartyLinkModal
								link={setLink}
								show={showModal}
								onClose={() => setShowModal(false)}
								appendBody={getMessage(
									"experience.links.communityWiki.appendBody",
									{
										lineBreak: <br />,
									},
								)}
							/>
							<Button
								as="a"
								href={setLink}
								className="experience-link"
								type="secondary"
								onClick={(e) => {
									e.preventDefault();
									setShowModal(true);
								}}
							>
								<MdOutlineMenuBook className="roseal-icon" />
								<span className="experience-link-text">
									{isSameLocale
										? getMessage(messagePrefix)
										: getMessage(`${messagePrefix}.otherLanguage`, {
												language: languageNamesFormat.of(link.locale),
											})}
								</span>
							</Button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
