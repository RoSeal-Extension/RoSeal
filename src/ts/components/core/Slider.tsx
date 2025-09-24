import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import { getProgress } from "src/ts/utils/misc";

export type SliderProps = {
	max: number;
	min: number;
	step: number;
	className?: string;
	value: number;
	id?: string;
	onFinalUpdate?: (value: number) => void;
	onUpdate?: (value: number) => void;
};

export default function Slider({
	max,
	min,
	step,
	className,
	id,
	value: _value,
	onUpdate,
	onFinalUpdate,
}: SliderProps) {
	const [value, setValue] = useState(_value);
	useEffect(() => {
		setValue(_value);
	}, [_value]);

	return (
		<input
			type="range"
			className={classNames("roseal-range", className)}
			style={{
				"--value": getProgress(value, min, max),
			}}
			id={id}
			step={step}
			min={min}
			max={max}
			value={value}
			onMouseUp={() => onFinalUpdate?.(value)}
			onTouchEnd={() => onFinalUpdate?.(value)}
			onChange={(e) => {
				const value = Number.parseFloat(e.currentTarget.value);
				setValue(value);
				onUpdate?.(value);
			}}
		/>
	);
}
