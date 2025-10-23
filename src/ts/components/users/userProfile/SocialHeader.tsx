import classNames from "classnames";
import type { ComponentChild } from "preact";

export type SocialHeaderProps = {
	title: string;
	value: ComponentChild;
	alt: string;
	link?: string;
	className?: string;
	enabled?: boolean;
	onClick?: () => void;
};

export default function SocialHeader({
	title,
	alt,
	value,
	link,
	className,
	onClick,
}: SocialHeaderProps) {
	const Tag = link ? "a" : onClick ? "button" : "span";

	return (
		<li className={className}>
			<Tag
				className={classNames(
					"profile-header-social-count roseal-profile-header-social-count",
					{
						"roseal-btn": onClick,
						"clickable-link": onClick,
					},
				)}
				href={link}
				title={alt}
				onClick={onClick}
			>
				<span>
					<b>{value}</b>{" "}
					<span className="profile-header-social-count-label">{title}</span>
				</span>
			</Tag>
		</li>
	);
}
