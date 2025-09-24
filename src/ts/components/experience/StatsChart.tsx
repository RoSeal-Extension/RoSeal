import {
	CategoryScale,
	Chart as ChartJS,
	Tooltip as ChartTooltip,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Signal } from "@preact/signals";
import type { LiveStatsHistorySignal } from "src/ts/pages/main/www/experiences/[id]/[name]";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { locales } from "src/ts/helpers/i18n/locales.ts";
import { useMemo, useState } from "preact/hooks";
import { useTheme } from "../hooks/useTheme";
import type { ChartJSOrUndefined } from "node_modules/react-chartjs-2/dist/types";
import PillToggle from "../core/PillToggle";

// CHARTJS REGISTRATION GLOBALLY
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	ChartTooltip,
	Legend,
);

export type ExperienceStatsChartProps = {
	data: Signal<LiveStatsHistorySignal>;
	refSignal: Signal<ChartJSOrUndefined>;
};

type ActiveTabType = "playing" | "favorites" | "visits" | "votes";

export default function ExperienceStatsChart({ data, refSignal }: ExperienceStatsChartProps) {
	const [theme] = useTheme();
	const [activeTab, setActiveTab] = useState<ActiveTabType>("playing");

	return (
		<div className="experience-stats-chart-section">
			<div className="container-header">
				<h3>{getMessage("experience.statsChart.title")}</h3>
			</div>
			<div className="tab-header-container">
				<PillToggle
					items={[
						{ id: "playing", label: getMessage("experience.statsChart.tabs.playing") },
						{
							id: "favorites",
							label: getMessage("experience.statsChart.tabs.favorites"),
						},
						{ id: "visits", label: getMessage("experience.statsChart.tabs.visits") },
						{
							id: "votes",
							label: getMessage("experience.statsChart.tabs.votes"),
						},
					]}
					currentId={activeTab}
					onClick={setActiveTab}
				/>
			</div>
			<div className="chart-container">
				<Line
					/* @ts-expect-error: fine */
					ref={(ref: ChartJSOrUndefined) => {
						refSignal.value = ref;
					}}
					options={useMemo(
						() => ({
							responsive: true,
							spanGaps: true,
							plugins: {
								legend: {
									display: false,
								},
							},
							locale: locales[0],
							font: {
								family: "Builder Sans,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif",
							},
							scales: {
								x: {
									grid: {
										color:
											theme === "dark"
												? "rgba(255, 255, 255, 0.1)"
												: undefined,
									},
									ticks: {
										color: theme === "dark" ? "white" : undefined,
									},
								},
								y: {
									grid: {
										color:
											theme === "dark"
												? "rgba(255, 255, 255, 0.1)"
												: undefined,
									},
									ticks: {
										color: theme === "dark" ? "white" : undefined,
										precision: 0,
									},
									beginAtZero: true,
									grace: "10%",
									min: 0,
									suggestedMax: () => {
										const values =
											activeTab === "votes"
												? [...data.value.votes[1], ...data.value.votes[2]]
												: data.value[activeTab][1];
										const maxValue = Math.max(...values);
										return maxValue * 1.2;
									},
								},
							},
						}),

						[theme, activeTab, data.value],
					)}
					data={useMemo(() => {
						const firstTab = activeTab === "votes" ? "upVotes" : activeTab;

						const datasets = [
							{
								label: getMessage(`experience.statsChart.tabs.${firstTab}`),
								data: data.value[activeTab][1],
								borderColor:
									firstTab === "upVotes"
										? "rgb(51, 95, 255)"
										: theme === "light"
											? "rgb(0, 0, 0)"
											: "rgb(255, 255, 255)",
								backgroundColor:
									firstTab === "upVotes"
										? "rgba(51, 95, 255, 0.5)"
										: theme === "light"
											? "rgba(0, 0, 0, 0.5)"
											: "rgba(255, 255, 255, 0.5)",
								spanGaps: true,
							},
						];

						if (activeTab === "votes") {
							datasets.push({
								label: getMessage("experience.statsChart.tabs.downVotes"),
								data: data.value[activeTab][2],
								borderColor: "rgb(223, 40, 31)",
								backgroundColor: "rgba(223, 40, 31, 0.5)",
								spanGaps: true,
							});
						}

						return {
							labels: data.value[activeTab][0],
							datasets,
						};
					}, [activeTab, data.value, theme])}
				/>
			</div>
		</div>
	);
}
