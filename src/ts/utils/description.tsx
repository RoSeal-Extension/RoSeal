import { render } from "preact";
import MentionLinkify from "../components/core/MentionLinkify";
import { watchAttributes } from "../helpers/elements";

export function renderMentions(el: HTMLElement) {
	if (el.classList.contains("invisible")) {
		watchAttributes(
			el,
			(_, __, ___, ____, kill) => {
				if (el.classList.contains("invisible")) {
					return;
				}

				kill?.();
				render(<MentionLinkify content={el.textContent} />, el);
			},
			["class"],
		);
		return;
	}

	if (el.classList.contains("linkify")) {
		el.classList.remove("linkify");
	}

	if (el.textContent && !el.hasAttribute("data-original-content")) {
		el.setAttribute("data-original-content", el.textContent);
	}

	render(
		<MentionLinkify content={el.getAttribute("data-original-content") ?? el.textContent} />,
		el,
	);
}
