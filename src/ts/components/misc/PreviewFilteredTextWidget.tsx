import MdOutlineInfo from "@material-symbols/svg-400/outlined/filter_alt-fill.svg";
import classNames from "classnames";
import fastDiff from "fast-diff";
import { useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { filterText, type FilterTextResponse } from "src/ts/helpers/requests/services/misc";

type ModerationProp = FilterTextResponse & {
	originalText: string;
};

export default function PreviewFilteredTextWidget() {
	const [enteredArea, setEnteredArea] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	const [text, setText] = useState<string>("");
	const [hasInputSinceCheck, setHasInputSinceCheck] = useState(false);

	const [moderation, setModeration] = useState<ModerationProp | undefined>();

	const diffs = useMemo(() => {
		if (
			!moderation?.filteredText ||
			!moderation.originalText ||
			moderation.moderationLevel !== 2
		) {
			return;
		}

		return fastDiff(
			moderation.originalText
				.replace(/\r\n|\r|\n/g, " ")
				.replace(/\s+/g, " ")
				.trim(),
			moderation.filteredText,
		).map((diff) => (
			<span
				key={diff[1]}
				className={classNames({
					insert: diff[0] === fastDiff.INSERT,
					delete: diff[0] === fastDiff.DELETE,
				})}
			>
				{diff[1]}
			</span>
		));
	}, [moderation?.filteredText, moderation?.originalText]);

	return (
		<div
			id="preview-filtered-text-widget"
			onMouseLeave={() => {
				setEnteredArea(false);
			}}
		>
			{showPreview && (
				<div className="preview-container">
					{moderation && (
						<div className="moderation-container">
							<div className="moderation-header">
								<h3>
									{getMessage("moderatedTextPreviewWidget.popup.diffs.header")}
								</h3>
							</div>
							<div className="moderation-status-text">
								{getMessage(
									`moderatedTextPreviewWidget.popup.status.${moderation.moderationLevel}`,
								)}
							</div>
							{diffs && <div className="diffs-container">{diffs}</div>}
						</div>
					)}
					<div className="input-text-area-container">
						<textarea
							className="input-text-area"
							onInput={(e) => {
								setText(e.currentTarget.value);
								setHasInputSinceCheck(true);
							}}
							placeholder={getMessage("moderatedTextPreviewWidget.popup.placeholder")}
							value={text}
						/>
					</div>
					<div className="btns-container">
						<button
							type="button"
							className="roseal-btn check-filter-btn"
							disabled={!hasInputSinceCheck || !text}
							onClick={() => {
								if (!hasInputSinceCheck || !text) {
									return;
								}

								setHasInputSinceCheck(false);
								setModeration(undefined);

								filterText({ text }).then((res) => {
									setModeration({
										...res,
										originalText: text,
									});
								});
							}}
						>
							{getMessage("moderatedTextPreviewWidget.popup.buttons.action")}
						</button>
					</div>
				</div>
			)}
			<button
				type="button"
				className={classNames("roseal-btn widget-button", {
					"is-entered": enteredArea || showPreview,
				})}
				onMouseEnter={() => setEnteredArea(true)}
				onClick={() => setShowPreview((prev) => !prev)}
			>
				<MdOutlineInfo className="roseal-icon" />
				<span>{getMessage("moderatedTextPreviewWidget.button")}</span>
			</button>
		</div>
	);
}
