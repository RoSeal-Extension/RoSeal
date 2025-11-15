import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact.tsx";
import Button from "../Button.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { getRobloxCDNUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getHomePageUrl } from "src/ts/utils/links.ts";

export default function Page404() {
	return (
		<>
			<link
				rel="stylesheet"
				href={`https://${getRobloxCDNUrl("static", "/CSS/Pages/RobloxError/RobloxError.css")}`}
			/>
			<div className="request-error-page-content roseal-error-page">
				<div className="default-error-page section-content">
					<img
						src={`https://${getRobloxCDNUrl("images", "/db3312a56f2d4b12e4a5e55523e6320c.png")}`}
						className="error-image"
						alt={getMessage("errorPage.404.imageAlt")}
					/>

					<div className="message-container">
						<h3 className="error-title">{getMessage("errorPage.404.title")}</h3>
						<h4 className="error-message">
							{getMessage("errorPage.404.message", {
								sealEmoji: SEAL_EMOJI_COMPONENT,
								span: (contents: string) => <span>{contents}</span>,
							})}
						</h4>
					</div>

					<div className="action-buttons">
						<Button
							as="a"
							type="primary"
							size="md"
							title={getMessage("errorPage.404.back.alt")}
							onClick={() => history.back()}
						>
							{getMessage("errorPage.404.back")}
						</Button>{" "}
						<Button
							as="a"
							type="control"
							size="md"
							title={getMessage("errorPage.404.home.alt")}
							href={getHomePageUrl()}
						>
							{getMessage("errorPage.404.home")}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
