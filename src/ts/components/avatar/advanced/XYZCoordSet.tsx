import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { AssetMetaCoords } from "src/ts/helpers/requests/services/avatar";
import XYZCoord from "./XYZCoord";

export type XYZCoordSetProps = {
	lowerBounds?: AssetMetaCoords;
	upperBounds?: AssetMetaCoords;
	value: AssetMetaCoords;
	onUpdate: (value: AssetMetaCoords) => void;
	showTotal?: boolean;
};

export function XYZCoordSet({
	lowerBounds,
	upperBounds,
	value,
	showTotal,
	onUpdate,
}: XYZCoordSetProps) {
	return (
		<div className="xyz-coords-fields">
			<XYZCoord
				showTotal={showTotal}
				label={showTotal ? undefined : getMessage("avatar.advanced.asset.coordsItem.X")}
				value={value.X}
				lowerBounds={lowerBounds?.X}
				upperBounds={upperBounds?.X}
				updateValue={(x) => {
					if (showTotal) {
						onUpdate({ ...value, X: x, Y: x, Z: x });
					} else {
						onUpdate({ ...value, X: x });
					}
				}}
			/>
			{!showTotal && (
				<>
					<XYZCoord
						showTotal={showTotal}
						label={getMessage("avatar.advanced.asset.coordsItem.Y")}
						value={value.Y}
						lowerBounds={lowerBounds?.Y}
						upperBounds={upperBounds?.Y}
						updateValue={(y) => {
							onUpdate({ ...value, Y: y });
						}}
					/>
					<XYZCoord
						showTotal={showTotal}
						label={getMessage("avatar.advanced.asset.coordsItem.Z")}
						value={value.Z}
						lowerBounds={lowerBounds?.Z}
						upperBounds={upperBounds?.Z}
						updateValue={(z) => {
							onUpdate({ ...value, Z: z });
						}}
					/>
				</>
			)}
		</div>
	);
}
