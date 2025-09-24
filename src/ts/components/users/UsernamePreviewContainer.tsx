import { useEffect, useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { computeUsernameExperienceChatColor } from "src/ts/utils/fun/usernameColors";

export type UsernamePreviewContainerProps = {
	el: HTMLInputElement;
};

export default function UsernamePreviewContainer({ el }: UsernamePreviewContainerProps) {
	const [username, setUsername] = useState(el.value);
	const color = useMemo(() => computeUsernameExperienceChatColor(username), [username]);

	useEffect(() => {
		const onChangeListener = () => setUsername(el.value);
		el.addEventListener("input", onChangeListener);

		return () => el.removeEventListener("input", onChangeListener);
	}, [el]);

	return (
		<>
			{username !== "" && (
				<span
					className="username-preview-container"
					style={{
						color,
					}}
				>
					{getMessage("usernamePreviewContainer.text", {
						username,
					})}
				</span>
			)}
		</>
	);
}
