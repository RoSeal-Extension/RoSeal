import MdOutlineSearchOff from "@material-symbols/svg-400/outlined/search_off-fill.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function ExperienceShadowBannedNotice() {
	return (
		<div className="experience-shadow-banned-notice">
			<div className="notice-icon-container">
				<MdOutlineSearchOff className="roseal-icon" />
			</div>
			<div className="notice-text-container">
				<div className="container-header">
					<h2>{getMessage("experience.shadowBannedNotice.title")}</h2>
				</div>
				<p>{getMessage("experience.shadowBannedNotice.description")}</p>
			</div>
		</div>
	);
}
