import { getMessage } from "src/ts/helpers/i18n/getMessage";
import ExperienceTab from "../Tab";
import PlacesTabContent from "./TabContent";

export type PlacesTabProps = {
	list: HTMLElement;
	universeId: number;
	currentPlaceId: number;
};

export default function PlacesTab({ list, universeId, currentPlaceId }: PlacesTabProps) {
	return (
		<ExperienceTab
			id="places"
			tabList={list}
			title={getMessage("experience.places.title")}
			content={<PlacesTabContent universeId={universeId} currentPlaceId={currentPlaceId} />}
		/>
	);
}
