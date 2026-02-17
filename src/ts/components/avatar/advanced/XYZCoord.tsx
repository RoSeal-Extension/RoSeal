import { useEffect, useMemo, useState } from "preact/hooks";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import IconButton from "../../core/IconButton";
import Slider from "../../core/Slider";
import TextInput from "../../core/TextInput";

export type XYZCoordProps = {
	showTotal?: boolean;
	label?: string;
	value: number;
	lowerBounds?: number;
	upperBounds?: number;
	updateValue: (value: number) => void;
};

export default function XYZCoord({
	showTotal,
	label,
	value,
	lowerBounds,
	upperBounds,
	updateValue,
}: XYZCoordProps) {
	const [editing, setEditing] = useState(false);
	const [previewValue, setPreviewValue] = useState(0);

	useEffect(() => {
		setPreviewValue(value);
	}, [value]);

	const localizeOptions = useMemo(
		() =>
			({
				style: showTotal ? "percent" : "decimal",
				maximumFractionDigits: showTotal ? undefined : 4,
			}) as const,
		[showTotal],
	);

	const min = lowerBounds ?? value;
	const max = upperBounds ?? value;

	return (
		<div className="coord-field font-bold config-section">
			<div className="section-label">
				{label !== undefined && (
					<div className="title-label">
						<span className="title-label-text">{label}</span>
					</div>
				)}
				{editing ? (
					<TextInput
						type="number"
						className="value-input"
						placeholder={showTotal ? (min * 100).toString() : min.toString()}
						min={showTotal ? min * 100 : min}
						max={showTotal ? max * 100 : max}
						onChange={(value) =>
							updateValue(Number.parseFloat(value) / (showTotal ? 100 : 1))
						}
						step={showTotal ? 1 : 0.01}
						value={showTotal ? previewValue * 100 : previewValue}
					/>
				) : (
					<div className="value-label">
						{asLocaleString(previewValue, localizeOptions)}
					</div>
				)}
				<IconButton iconName="edit" size="sm" onClick={() => setEditing(!editing)} />
			</div>
			<Slider
				min={min}
				max={max}
				value={value}
				onUpdate={setPreviewValue}
				onFinalUpdate={updateValue}
				step={0.01}
			/>
		</div>
	);
}
