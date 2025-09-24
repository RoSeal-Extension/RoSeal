import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useEffect, useRef, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { ExperienceEvent as ExperienceEventType } from "src/ts/helpers/requests/services/universes";
import { useResizeObserver } from "usehooks-ts";
import PillToggle from "../../core/PillToggle";
import ExperienceEvent from "./Event";

export type EventsTabContentProps = {
	pastEvents: Signal<ExperienceEventType[]>;
	count: Signal<number>;
};

type EventsTabType = "current" | "past";
export default function EventsContentTab({ pastEvents, count }: EventsTabContentProps) {
	const [activeTab, setActiveTab] = useState<EventsTabType>("current");
	const ref = useRef<HTMLDivElement>(null);
	const { width } = useResizeObserver({
		ref,
	});

	useEffect(() => {
		document.documentElement.style.setProperty("--home-feed-width", `${width}px`);
	}, [width]);

	return (
		<div className="roseal-events-container" ref={ref}>
			{pastEvents.value.length > 0 && (
				<PillToggle
					className="event-tabs-toggle"
					items={[
						{ id: "current", label: getMessage("experience.events.current.title") },
						{ id: "past", label: getMessage("experience.events.past.title") },
					]}
					onClick={(id) => setActiveTab(id as EventsTabType)}
					currentId={activeTab}
				/>
			)}
			<div className="virtual-event-lists-container">
				<div
					className={classNames("virtual-event-game-details-container", {
						hide: activeTab !== "current",
					})}
					id="roseal-current-events-container"
				>
					{count.value === 0 && (
						<div className="section-content-off">
							{getMessage("experience.events.current.noItems")}
						</div>
					)}
				</div>
				{pastEvents.value.length > 0 && (
					<div
						className={classNames("virtual-event-game-details-container", {
							hide: activeTab !== "past",
						})}
						id="roseal-past-events-container"
					>
						<div className="stack">
							<ul className="game-grid wide-game-tile-game-grid game-details-page-events-grid">
								{pastEvents.value.map((pastEvent) => (
									<ExperienceEvent key={pastEvent.id} {...pastEvent} />
								))}
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
