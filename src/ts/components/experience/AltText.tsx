import { useEffect, useState } from "preact/hooks";
import Tooltip from "../core/Tooltip.tsx";
import { watchAttributes } from "src/ts/helpers/elements.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";

export type MediaAltTextProps = {
	carouselContainer: HTMLElement;
};

export default function MediaAltText({ carouselContainer }: MediaAltTextProps) {
	const [show, setShow] = useState(false);
	const [altText, setAltText] = useState<string>("");

	useEffect(() => {
		const runSetAlt = () => {
			const newAlt = carouselContainer
				.querySelector(".carousel-item-active:not(.carousel-video) img[alt]")
				?.getAttribute("alt");

			if (newAlt) {
				setShow(true);
				setAltText(newAlt);
			} else {
				setShow(false);
			}
		};

		runSetAlt();
		return watchAttributes(carouselContainer, runSetAlt, ["class"], undefined, true);
	}, []);

	return (
		<>
			{show && (
				<Tooltip
					containerClassName="btn-alt-text-container"
					placement="top"
					button={
						<button type="button" className="carousel-controls btn-alt-text">
							{getMessage("experience.media.altText")}
						</button>
					}
				>
					{altText}
				</Tooltip>
			)}
		</>
	);
}
