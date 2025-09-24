import {
	CoatHangerIcon,
	HardHatIcon,
	PantsIcon,
	StackIcon,
	TShirtIcon,
	WatchIcon,
} from "@phosphor-icons/react";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { WornAssetLimit } from "src/ts/utils/itemTypes";
import Tooltip from "../../core/Tooltip";

export type AvatarAdvancedLimitViewProps = {
	limit: WornAssetLimit;
};

const typeToIcon = {
	LayeredClothing: StackIcon,
	Accessories: WatchIcon,
	Tops: TShirtIcon,
	Outerwear: CoatHangerIcon,
	Hat: HardHatIcon,
	Bottoms: PantsIcon,
};

export default function AvatarAdvancedLimitView({ limit }: AvatarAdvancedLimitViewProps) {
	const key = `avatar.advanced.limits.item.tooltip.${limit.type}` as const;
	if (!hasMessage(key)) return null;

	const Icon = typeToIcon[limit.type as keyof typeof typeToIcon];

	return (
		<Tooltip
			containerClassName="item-limit-container"
			includeContainerClassName={false}
			button={
				<div className="item-limit">
					<div className="item-icon">
						<Icon className="roseal-icon" />
					</div>
					<div className="item-count">
						{getMessage("avatar.advanced.limits.item.used", {
							used: asLocaleString(limit.used),
							max: asLocaleString(limit.max),
						})}
					</div>
				</div>
			}
		>
			{getMessage(key)}
		</Tooltip>
	);
}
