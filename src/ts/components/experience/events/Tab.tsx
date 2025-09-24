import type { Signal } from "@preact/signals";
import ExperienceTab from "../Tab.tsx";
import EventsTabContent from "./TabContent.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";
import type { ExperienceEvent } from "src/ts/helpers/requests/services/universes.ts";

export type ExperienceEventsTabProps = {
	list: HTMLDivElement;
	eventCount: Signal<number>;
	pastEvents: Signal<ExperienceEvent[]>;
	onRender?: () => void;
};

export default function ExperienceEventsTab({
	list,
	eventCount,
	pastEvents,
	onRender,
}: ExperienceEventsTabProps) {
	return (
		<ExperienceTab
			id="events"
			tabList={list}
			title={getMessage("experience.events")}
			content={<EventsTabContent pastEvents={pastEvents} count={eventCount} />}
			onRender={onRender}
		>
			{eventCount.value !== 0 && (
				<span className="notification-red notification">
					{asLocaleString(eventCount.value)}
				</span>
			)}
		</ExperienceTab>
	);
}
