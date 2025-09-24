import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SimpleModal from "./modal/SimpleModal";
import { formatUrl } from "src/ts/utils/url";
import type { JSX } from "preact";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type ThirdPartyLinkModal = {
	show: boolean;
	link: string;
	bodyOverride?: string | JSX.Element;
	appendBody?: string | JSX.Element;
	domainOverride?: string;
	onClose: () => void;
};

export default function ThirdPartyLinkModal({
	link: _link,
	show,
	bodyOverride,
	appendBody,
	domainOverride,
	onClose,
}: ThirdPartyLinkModal) {
	const link = useMemo(() => formatUrl(_link), [_link]);
	const domain = useMemo(() => {
		if (bodyOverride) {
			return;
		}
		if (domainOverride) {
			return domainOverride;
		}

		return link?.hostname ?? "";
	}, [link]);

	return (
		<SimpleModal
			show={show}
			size="md"
			centerTitle
			title={getMessage("thirdPartyLink.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			centerBody
			className="third-party-link-modal"
			buttons={[
				{
					type: "neutral",
					text: getMessage("thirdPartyLink.neutral"),
					onClick: onClose,
				},
				{
					type: "action",
					text: getMessage("thirdPartyLink.action"),
					onClick: () => {
						if (link) {
							globalThis.open(link?.toString(), "_blank");
						}
						onClose();
					},
				},
			]}
		>
			{bodyOverride ||
				getMessage("thirdPartyLink.body", {
					domain: <span className="third-party-link-domain">{domain}</span>,
					hasDomainOverride: typeof domainOverride === "string",
				})}
			{appendBody}
		</SimpleModal>
	);
}
