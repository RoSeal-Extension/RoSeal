import classNames from "classnames";
import { type GeoProjection, geoLength } from "d3-geo";
import { useMemo } from "preact/hooks";
import type { DOMContainer } from "react-overlays/useWaitForDOMRef";
import { Marker } from "react-simple-maps";
import CountryFlag from "src/ts/components/core/CountryFlag";
import Tooltip from "src/ts/components/core/Tooltip";
import { getLocalizedRegionName } from "../utils";
import type { RobloxGroupedDataCenterWithServerCount } from "./ServerMap";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";

export type ServerMapMarkerProps = {
	dataCenter: RobloxGroupedDataCenterWithServerCount;
	projection: GeoProjection;
	rotation: [number, number, number];
	pointSize: number;
	container: DOMContainer;
	onSelect: () => void;
};

export default function ServerMapMarker({
	dataCenter,
	projection,
	rotation,
	pointSize,
	container,
	onSelect,
}: ServerMapMarkerProps) {
	const coordinates = useMemo(
		() => [dataCenter.location.latLong[1], dataCenter.location.latLong[0]] as [number, number],
		[dataCenter.location.latLong[0], dataCenter.location.latLong[1]],
	);

	// culling because the maintainer was too lazy
	const isHidden = useMemo(() => {
		if (!projection) return true;

		const distance = geoLength({
			type: "Feature",
			// @ts-expect-error: these types are broken
			geometry: {
				type: "LineString",
				coordinates: [[-rotation[0], -rotation[1]], coordinates],
			},
		});
		return distance > Math.PI / 2;
	}, [projection, rotation, coordinates]);

	if (isHidden) return null;

	const isAvailable = dataCenter.serverCount !== 0;

	return (
		<Marker
			coordinates={coordinates}
			className={classNames("datacenter-marker", {
				"is-available": isAvailable,
			})}
			onClick={isAvailable ? onSelect : undefined}
		>
			<Tooltip
				skipElement
				button={
					<circle className="datacenter-dot" r={pointSize} strokeWidth={pointSize / 2} />
				}
				container={container}
				className="datacenter-info-tooltip"
				placement="auto"
			>
				<div className="region-name-container">
					<CountryFlag code={dataCenter.location.country} className="region-flag-icon" />
					<h2 className="region-name">
						{getLocalizedRegionName(dataCenter.location, false, true)}
					</h2>
				</div>
				<ul className="regions-stats-container">
					<li className="region-stat">
						{getMessage(
							"experience.servers.regionSelector.modal.dataCenter.dataCenterCount",
							{
								totalNum: dataCenter.dataCenterIds.length,
								total: asLocaleString(dataCenter.dataCenterIds.length),
							},
						)}
					</li>
					<li className="region-stat">
						{getMessage(
							"experience.servers.regionSelector.modal.dataCenter.serverCount",
							{
								totalNum: dataCenter.serverCount,
								total: asLocaleString(dataCenter.serverCount),
							},
						)}
					</li>
				</ul>
			</Tooltip>
		</Marker>
	);
}
