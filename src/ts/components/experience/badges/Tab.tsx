import ExperienceTab from "../Tab.tsx";
import BadgesTabContent from "./TabContent.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";

export type ExperienceBadgesTabProps = {
	list: HTMLDivElement;
	universeId: number;
};

export default function ExperienceBadgesTab({ list, universeId }: ExperienceBadgesTabProps) {
	return (
		<ExperienceTab
			id="badges"
			tabList={list}
			title={getMessage("experience.badges.title")}
			content={<BadgesTabContent universeId={universeId} />}
		/>
	);
}
