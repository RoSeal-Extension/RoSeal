import classNames from "classnames";
import fastDiff from "fast-diff";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type FilteredTextPreviewProps = {
	text: string;
	filteredText: string;
	moderationLevel: 2 | 3;
};

export default function FilteredTextPreview({
	text,
	filteredText,
	moderationLevel,
}: FilteredTextPreviewProps) {
	const diffs = useMemo(
		() =>
			fastDiff(
				text
					.replace(/\r\n|\r|\n/g, " ")
					.replace(/\s+/g, " ")
					.trim(),
				filteredText,
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
			)),
		[text, filteredText],
	);

	return (
		<div className="roseal-filtered-preview">
			<span className="text-emphasis">
				{getMessage(`moderatedTextPreview.level.${moderationLevel}`)}
			</span>
			{moderationLevel < 3 && (
				<>
					<p className="text-preview roseal-scrollbar input-field">{diffs}</p>
					<span className="small text">{getMessage("moderatedTextPreview.footer")}</span>
				</>
			)}
		</div>
	);
}
