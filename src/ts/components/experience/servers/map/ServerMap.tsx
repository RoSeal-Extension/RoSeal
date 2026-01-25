import { useSignal } from "@preact/signals";
import { drag } from "d3-drag";
import { geoOrthographic } from "d3-geo";
import { select } from "d3-selection";
import { zoom } from "d3-zoom";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ComposableMap, Geographies, Geography, Sphere } from "react-simple-maps";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getMapLakesWorldData, getMapWorldData } from "src/ts/helpers/requests/services/misc";
import SimpleModal from "../../../core/modal/SimpleModal";
import usePromise from "../../../hooks/usePromise";
import type { RobloxGroupedDataCenterWithDistance } from "../ServersTabProvider";
import ServerMapMarker from "./Marker";
import { getDistanceLatLong } from "../utils";
import { clamp } from "src/ts/utils/misc";

export type RobloxGroupedDataCenterWithServerCount = RobloxGroupedDataCenterWithDistance & {
	serverCount: number;
};

export type ServerGlobeMapProps = {
	show: boolean;
	setShow: (show: boolean) => void;
	dataCenters: RobloxGroupedDataCenterWithServerCount[];
	initialLatLong?: [number, number];
	onSelect: (dataCenter: RobloxGroupedDataCenterWithServerCount) => void;
};

const INITIAL_SCALE = 300;
const DEFAULT_DRAG_SENSITIVTY = 600;
const DEFAULT_SCALE_EXTENT = [1, 8] as [number, number];

export default function ServerGlobeMap({
	show,
	setShow,
	dataCenters,
	initialLatLong,
	onSelect,
}: ServerGlobeMapProps) {
	const [worldMap, , worldMapErr] = usePromise(getMapWorldData, []);
	const [lakes] = usePromise(getMapLakesWorldData, []);

	const ref = useRef<HTMLDivElement>(null);
	const [svgNode, setSvgNode] = useState<SVGSVGElement | null>(null);
	const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
	const [hasInteracted, setHasInteracted] = useState(false);

	const scale = useSignal(INITIAL_SCALE);

	// Set initial rotation and scale if provided
	useEffect(() => {
		if (initialLatLong && !hasInteracted) {
			let closestDataCenter: RobloxGroupedDataCenterWithServerCount | undefined;
			let closestDistance: number | undefined;

			for (const dataCenter of dataCenters) {
				const distance = getDistanceLatLong(initialLatLong, dataCenter.location.latLong);
				if (!closestDistance || closestDistance > distance) {
					closestDataCenter = dataCenter;
					closestDistance = distance;
				}
			}

			if (!closestDataCenter) return;

			setRotation([
				-closestDataCenter.location.latLong[1],
				-closestDataCenter.location.latLong[0],
				0,
			]);
			scale.value = INITIAL_SCALE * 3;
		}
	}, [initialLatLong, dataCenters]);

	const projection = useMemo(
		() => geoOrthographic().scale(scale.value).rotate(rotation).clipAngle(90).center([9, 10]),
		[rotation, scale.value, svgNode],
	);

	// Setup drag and zoom
	useEffect(() => {
		if (!svgNode) return;

		const d3Svg = select(svgNode);
		const dragHandler = drag<SVGSVGElement, unknown>().on("drag", (event) => {
			setHasInteracted(true);
			const dragSensitivity = DEFAULT_DRAG_SENSITIVTY * (scale.value / INITIAL_SCALE);
			setRotation((prev) => [
				(prev[0] + (event.dx * 360) / dragSensitivity) % 360,
				clamp(prev[1] - (event.dy * 360) / dragSensitivity, -100, 100),
				0,
			]);
		});

		d3Svg.call(dragHandler);

		// Zoom handler
		const zoomHandler = zoom<SVGSVGElement, unknown>()
			.scaleExtent(DEFAULT_SCALE_EXTENT)
			.on("zoom", (event) => {
				setHasInteracted(true);

				scale.value = INITIAL_SCALE * event.transform.k;
			});

		const subscribeListener = scale.subscribe((newValue) => {
			zoomHandler.scaleTo(d3Svg, newValue / INITIAL_SCALE);
		});

		d3Svg.call(zoomHandler);

		// Cleanup
		return () => {
			d3Svg.on(".drag", null).on(".zoom", null);
			subscribeListener();
		};
	}, [svgNode, scale]);

	const pointSize = useMemo(() => 3.5 * (scale.value / INITIAL_SCALE), [scale.value]);

	const dataCenterMarkers = useMemo(
		() =>
			dataCenters.map((dc) => (
				<ServerMapMarker
					key={dc.dataCenterIds[0]}
					dataCenter={dc}
					projection={projection}
					rotation={rotation}
					pointSize={pointSize}
					container={ref}
					onSelect={() => {
						onSelect(dc);
						setShow(false);
					}}
				/>
			)),
		[dataCenters, rotation, pointSize, projection],
	);

	const landMass = useMemo(
		() =>
			worldMap && (
				<Geographies geography={worldMap}>
					{({ geographies }) =>
						geographies?.map((geo) => (
							<Geography
								key={geo.rsmKey}
								className="geographic-region"
								geography={geo}
							/>
						))
					}
				</Geographies>
			),
		[worldMap],
	);

	const lakesMass = useMemo(
		() =>
			lakes && (
				<Geographies geography={lakes}>
					{({ geographies }) =>
						geographies.map((geo) => (
							<Geography
								key={geo.rsmKey}
								className="geographic-lake"
								geography={geo}
							/>
						))
					}
				</Geographies>
			),
		[lakes],
	);

	return (
		<SimpleModal
			show={show}
			title={getMessage("experience.servers.regionSelector.modal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			subtitle={getMessage("experience.servers.regionSelector.modal.subtitle")}
			className="region-filter-modal"
			onClose={() => setShow(false)}
		>
			{worldMap && (
				<div className="globe-map-container" ref={ref}>
					<ComposableMap
						// @ts-expect-error: idk how this works but it works ig
						projection={projection}
						className="globe-map"
						ref={setSvgNode}
					>
						{/* @ts-expect-error: dunno these types suck so much */}
						<Sphere />
						{landMass}
						{lakesMass}
						{dataCenterMarkers}
					</ComposableMap>
				</div>
			)}
			{worldMapErr && (
				<span className="text-error">
					{getMessage("experience.servers.regionSelector.modal.errors.mapLoadError")}
				</span>
			)}
		</SimpleModal>
	);
}
