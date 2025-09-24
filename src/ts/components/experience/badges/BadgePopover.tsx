import type { BadgeDetails } from "src/ts/helpers/requests/services/badges";
import type { RefObject, VNode } from "preact";
import Popover from "../../core/Popover";
import { useRef } from "preact/hooks";

export type BadgePopoverProps = {
	badge: BadgeDetails;
	children: VNode;
	containerRef?: RefObject<HTMLAnchorElement>;
};

export default function BadgePopover({ badge, children, containerRef }: BadgePopoverProps) {
	// unused for now
	return (
		<Popover
			trigger={["hover", "focus"]}
			button={children}
			className="experience-badge-popover"
			container={containerRef}
		/>
	);
}
