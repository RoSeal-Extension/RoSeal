import classNames from "classnames";
import type { SocialHeaderProps } from "./SocialHeader";

export default function SocialHeaderV2({
	title,
	alt,
	value,
	link,
	className,
	enabled,
	onClick,
}: SocialHeaderProps) {
	const disabled = !link && !onClick && !enabled;

	return (
		<button
			type="button"
			className={classNames(
				"roseal-profile-header-v2-social-count relative clip group/interactable focus-visible:outline-focus disabled:outline-none flex justify-center items-center radius-circle stroke-none padding-left-medium padding-right-medium height-800 text-label-medium bg-shift-300 content-action-utility",
				className,
			)}
			onClick={() => {
				if (onClick) onClick();

				if (link) {
					window.location.href = link;
				}
			}}
			disabled={disabled}
			data-disabled={disabled}
		>
			<div className="absolute inset-[0] transition-colors group-hover/interactable:bg-[var(--color-state-hover)] group-active/interactable:bg-[var(--color-state-press)] group-disabled/interactable:bg-none" />
			<span className="text-no-wrap text-truncate-end" title={alt}>
				{value} {title}
			</span>
		</button>
	);
}
