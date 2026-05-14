import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useEffect, useRef, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type ExperienceEvent as ExperienceEventType,
	type ListExperienceEventsResponse,
	listExperienceEvents,
} from "src/ts/helpers/requests/services/universes";
import { useResizeObserver } from "usehooks-ts";
import Pagination from "../../core/Pagination";
import PillToggle from "../../core/PillToggle";
import usePages from "../../hooks/usePages";
import ExperienceEvent from "./Event";

export type EventsTabContentProps = {
	universeId: number;
	pastEvents: Signal<ListExperienceEventsResponse | undefined>;
	count: Signal<number>;
};

type EventsTabType = "current" | "past";
export default function EventsContentTab({ universeId, pastEvents, count }: EventsTabContentProps) {
	const [activeTab, setActiveTab] = useState<EventsTabType>("current");
	const ref = useRef<HTMLDivElement>(null);
	const { width } = useResizeObserver({
		ref,
	});

	const { items, loading, pageNumber, maxPageNumber, hasAnyItems, setPageNumber } = usePages<
		ExperienceEventType,
		string
	>({
		getNextPage: (state) => {
			if (!state.nextCursor) {
				return {
					...state,
					items: pastEvents.value?.data ?? [],
					nextCursor: pastEvents.value?.nextPageCursor,
					hasNextPage: !!pastEvents.value?.nextPageCursor,
				};
			}

			return listExperienceEvents({
				universeId,
				endsBefore: new Date().toISOString(),
				visibility: "public",
				limit: 40,
				cursor: state.nextCursor,
			}).then((data) => ({
				...state,
				items: data.data,
				nextCursor: data.nextPageCursor ?? undefined,
				hasNextPage: !!data.nextPageCursor,
			}));
		},
		paging: {
			method: "pagination",
			itemsPerPage: 40,
		},
		dependencies: {
			reset: [universeId, pastEvents.value],
		},
		disabled: pastEvents.value === undefined,
	});

	console.log(items);

	useEffect(() => {
		document.documentElement.style.setProperty("--home-feed-width", `${width}px`);
	}, [width]);

	return (
		<div className="roseal-events-container" ref={ref}>
			{hasAnyItems && (
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
				{hasAnyItems && (
					<div
						className={classNames("virtual-event-game-details-container", {
							hide: activeTab !== "past",
							"roseal-disabled": loading,
						})}
						id="roseal-past-events-container"
					>
						<div className="stack">
							<ul className="game-grid wide-game-tile-game-grid game-details-page-events-grid">
								{items.map((pastEvent) => (
									<ExperienceEvent key={pastEvent.id} {...pastEvent} />
								))}
							</ul>
						</div>
						{(maxPageNumber > 1 || pageNumber > 1) && (
							<Pagination
								current={pageNumber}
								hasNext={pageNumber < maxPageNumber}
								onChange={setPageNumber}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
