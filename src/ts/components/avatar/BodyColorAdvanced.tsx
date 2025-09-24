import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type BodyColorAdvancedProps = {
	color: string;
	setColor: (color: string) => void;
};

export function BodyColorAdvanced({ color, setColor }: BodyColorAdvancedProps) {
	return (
		<div className="bodycolors-list-v2">
			<div className="border-bottom or-text">
				<span className="text small">
					{getMessage("avatar.bodyColorsV2", {
						sealEmoji: SEAL_EMOJI_COMPONENT,
					})}
				</span>
			</div>
			<div className="bodycolors-list-v2-section">
				<div className="roseal-color-group body-color-input">
					<input
						className="roseal-color-input"
						type="color"
						value={color}
						onBlur={(e) => {
							setColor(e.currentTarget.value);
						}}
					/>
				</div>
				<span className="small text">{getMessage("avatar.bodyColorsV2.hint")}</span>
			</div>
		</div>
	);
}
