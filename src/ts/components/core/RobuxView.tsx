import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";
import Icon from "./Icon.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import classNames from "classnames";

export type RobuxViewProps = {
	priceInRobux?: number | null;
	short?: boolean;
	gray?: boolean;
	isForSale?: boolean;
	largeText?: boolean;
	useGrouping?: boolean;
	smallIcon?: boolean;
	alignCenter?: boolean;
	useTextRobuxForFree?: boolean;
	crossedOut?: boolean;
	containerClassName?: string;
	textClassName?: string;
	iconClassName?: string;
	showZero?: boolean;
};

export default function RobuxView({
	priceInRobux,
	short = true,
	gray,
	isForSale,
	largeText,
	useGrouping = true,
	smallIcon,
	alignCenter = true,
	useTextRobuxForFree = false,
	crossedOut,
	containerClassName,
	textClassName,
	iconClassName,
	showZero,
}: RobuxViewProps) {
	const robuxAmount =
		priceInRobux !== undefined &&
		priceInRobux !== null &&
		asLocaleString(priceInRobux, {
			useGrouping,
		});
	return priceInRobux || isForSale ? (
		priceInRobux || showZero ? (
			<span
				className={classNames("roseal-robux-view", containerClassName, {
					"align-robux": alignCenter,
				})}
			>
				<Icon
					name={gray ? "robux-gray" : "robux"}
					size={smallIcon ? "14x14" : "16x16"}
					addSizeClass={smallIcon}
					className={iconClassName}
				/>
				<span
					className={
						textClassName
							? textClassName
							: gray
								? "text"
								: `text-robux${largeText ? "-lg" : ""}`
					}
				>
					{crossedOut ? <s>{robuxAmount}</s> : robuxAmount}
				</span>
			</span>
		) : (
			<span
				className={classNames("roseal-robux-view-free", containerClassName, {
					text: largeText,
					"text-free": !useTextRobuxForFree,
					"text-robux": useTextRobuxForFree && !largeText,
				})}
			>
				{getMessage("saleStatus.free")}
			</span>
		)
	) : (
		<span className={classNames("text-label roseal-robux-view-offsale", containerClassName)}>
			<span className="text-overflow font-caption-body">
				{getMessage(`saleStatus.offsale.${short ? "short" : "long"}`)}
			</span>
		</span>
	);
}
