import { languageNamesFormat } from "src/ts/helpers/i18n/intlFormats.ts";
import Button from "../../core/Button";
import MdOutlineMenuBook from "@material-symbols/svg-400/outlined/menu_book.svg";
import { useMemo, useState } from "preact/hooks";
import type { ExperienceLink as ExperienceLinkData } from "src/ts/helpers/requests/services/roseal";
import { locales } from "src/ts/helpers/i18n/locales.ts";
import ThirdPartyLinkModal from "../../core/ThirdPartyLinkModal.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ExperienceLinkItemProps = {
	link: ExperienceLinkData;
	shouldUseFandomMirror?: boolean;
};

export default function ExperienceLinkItem({
	link,
	shouldUseFandomMirror,
}: ExperienceLinkItemProps) {
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
				appendBody={getMessage("experience.links.communityWiki.appendBody", {
					lineBreak: <br />,
				})}
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
}
