import type { UserProfileFieldProps } from "./UserProfileField";

export default function UserProfileFieldV2({ children }: UserProfileFieldProps) {
	return (
		<div className="items-center gap-xsmall flex">
			<span className="grow-0 shrink-0 basis-auto icon icon-filled-circle-i size-[var(--icon-size-xsmall)]" />
			{children}
		</div>
	);
}
