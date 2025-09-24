import classNames from "classnames";
import type { ComponentChild } from "preact";
import type { FriendCardTypesProps } from "../../userFriends/FriendCardType";
import FriendCardTypes from "../../userFriends/FriendCardType";
import AvatarCardCaptionFirstLine from "./CardCaptionFirstLine";
import AvatarCardCaptionFooter from "./CardCaptionFooter";
import AvatarCardCaptionSecondLine from "./CardCaptionSecondLine";
import AvatarCardCaptionTitle from "./CardCaptionTitle";
import { useRef } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type AvatarCardCaptionProps = OmitExtend<
	Partial<FriendCardTypesProps>,
	{
		hasMenu?: boolean;
		username?: string;
		usernameLink?: string;
		displayName?: string;
		footer?: ComponentChild;
		className?: string;
		hasVerifiedBadge?: boolean;
		userId: number;

		isHidden?: boolean;

		labelFirstLine?: ComponentChild;
		labelFirstLineLink?: string;
		labelSecondLine?: ComponentChild;

		truncateFirstLine?: boolean;

		statusLinkLabel?: string;
		statusLink?: string;
	}
>;

export default function AvatarCardCaption({
	hasMenu,
	username,
	usernameLink,
	displayName,
	footer,
	className,
	hasVerifiedBadge,
	userId,

	isHidden,

	labelFirstLine,
	labelFirstLineLink,
	labelSecondLine,
	truncateFirstLine,

	statusLinkLabel,
	statusLink,

	availableConnectionTypes,
	connectionType,
	updateConnectionTypesLayout,
	openCreateType,
	openEditType,
	setConnectionType,
}: AvatarCardCaptionProps) {
	const useAvatarCaptionFooter = typeof footer === "string";
	const ref = useRef<HTMLDivElement>(null);

	return (
		<div
			className={classNames("avatar-card-caption", className, {
				"has-menu": hasMenu,
			})}
			ref={ref}
		>
			<span>
				<AvatarCardCaptionTitle
					title={displayName}
					titleLink={usernameLink}
					hasVerifiedBadge={hasVerifiedBadge}
				/>
				{!isHidden && (
					<div
						className={classNames("avatar-card-label", {
							shimmer: !username,
						})}
					>
						{username
							? getMessage("friends.card.username", {
									username,
								})
							: null}
					</div>
				)}
				<AvatarCardCaptionFirstLine
					firstLine={labelFirstLine}
					firstLineLink={labelFirstLineLink}
					isSingleLine={truncateFirstLine}
				/>
				<AvatarCardCaptionSecondLine
					secondLine={labelSecondLine}
					status={statusLinkLabel}
					statusLink={statusLink}
				/>
			</span>
			{useAvatarCaptionFooter ? (
				<AvatarCardCaptionFooter>{footer}</AvatarCardCaptionFooter>
			) : (
				footer
			)}
			{availableConnectionTypes &&
				connectionType &&
				setConnectionType &&
				openEditType &&
				openCreateType &&
				updateConnectionTypesLayout && (
					<FriendCardTypes
						updateConnectionTypesLayout={updateConnectionTypesLayout}
						availableConnectionTypes={availableConnectionTypes}
						connectionType={connectionType}
						setConnectionType={setConnectionType}
						container={ref}
						openEditType={openEditType}
						openCreateType={openCreateType}
						userId={userId}
					/>
				)}
		</div>
	);
}
