import { clamp } from "src/ts/utils/misc";
import type { ComponentChildren, WheelEventHandler } from "preact";
import { useCallback, useRef, useState } from "preact/hooks";
import MdOutlineChevronRight from "@material-symbols/svg-600/outlined/chevron_right-fill.svg";
import MdOutlineChevronLeft from "@material-symbols/svg-600/outlined/chevron_left-fill.svg";
import classNames from "classnames";

export type ItemCarouselProps = {
	children: ComponentChildren;
	className?: string;
};

export default function ItemCarousel({ children, className }: ItemCarouselProps) {
	const [scrollWidth, setScrollWidth] = useState(0);

	const [currentScrollLeft, setCurrentScrollLeft] = useState(0);
	const [maxScrollLeft, setMaxScrollLeft] = useState(0);

	const ref = useRef<HTMLDivElement>(null);

	const onWheel: WheelEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			const scrollLeft = clamp(e.deltaX + e.deltaY + currentScrollLeft, 0, maxScrollLeft);

			if (scrollLeft === currentScrollLeft) {
				return;
			}

			e.preventDefault();
			e.currentTarget.scrollTo({
				left: scrollLeft,
			});

			setCurrentScrollLeft(scrollLeft);
		},
		[currentScrollLeft, maxScrollLeft],
	);

	const onChevronClick = useCallback(
		(previous: boolean) => {
			const scrollLeft = clamp(
				currentScrollLeft + (previous ? -scrollWidth : scrollWidth),
				0,
				maxScrollLeft,
			);

			ref.current?.scrollTo({
				left: scrollLeft,
				behavior: "smooth",
			});

			setCurrentScrollLeft(scrollLeft);
		},
		[maxScrollLeft, currentScrollLeft],
	);

	return (
		<div className={classNames("roseal-item-carousel", className)}>
			{currentScrollLeft > 0 && (
				<button
					type="button"
					className="roseal-btn roseal-scroller previous"
					onClick={() => onChevronClick(true)}
				>
					<MdOutlineChevronLeft className="roseal-icon" />
				</button>
			)}
			{maxScrollLeft > currentScrollLeft && (
				<button
					type="button"
					className="roseal-btn roseal-scroller next"
					onClick={() => onChevronClick(false)}
				>
					<MdOutlineChevronRight className="roseal-icon" />
				</button>
			)}
			<div
				className="game-carousel horizontal-scroller dynamic-layout-sizing-disabled"
				ref={(el) => {
					ref.current = el;
					if (el) {
						const clientWidth = el.clientWidth;

						setScrollWidth(clientWidth);
						setMaxScrollLeft(el.scrollWidth - clientWidth);
					}
				}}
				onWheelCapture={onWheel}
			>
				{children}
			</div>
		</div>
	);
}
