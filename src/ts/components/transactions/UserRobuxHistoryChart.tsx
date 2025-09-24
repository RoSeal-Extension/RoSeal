import { ROBUX_HISTORY_STORAGE_KEY, type RobuxHistoryStorageValue } from "src/ts/constants/misc";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useStorage from "../hooks/useStorage";
import { useTheme } from "../hooks/useTheme";
import { Line } from "react-chartjs-2";
import { useMemo } from "preact/hooks";
import { locales } from "src/ts/helpers/i18n/locales";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function UserRobuxHistoryChart() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [theme] = useTheme();
	const [storage] = useStorage<RobuxHistoryStorageValue>(ROBUX_HISTORY_STORAGE_KEY, {});
	const history = useMemo(
		() => authenticatedUser && storage[authenticatedUser.userId],
		[authenticatedUser?.userId, storage],
	);

	const [dataPoints, labels] = useMemo(() => {
		const labels: string[] = [];
		const data: number[] = [];

		if (history)
			for (const item of history) {
				labels.push(getAbsoluteTime(item.date * 1_000 * 60 * 60));
				data.push(item.robux);
			}

		return [data, labels];
	}, [history]);

	return (
		<div className="robux-history-chart-section">
			<div className="container-header">
				<h3>{getMessage("transactions.robuxHistory.title")}</h3>
			</div>
			<div className="chart-container">
				<Line
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
									suggestedMax: Math.max(...dataPoints) * 1.2,
								},
							},
						}),

						[theme, dataPoints],
					)}
					data={useMemo(
						() => ({
							labels,
							datasets: [
								{
									label: getMessage(
										"transactions.robuxHistory.chart.datasets.robux",
									),
									data: dataPoints,
									borderColor:
										theme === "light" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)",
									backgroundColor:
										theme === "light"
											? "rgba(0, 0, 0, 0.5)"
											: "rgba(255, 255, 255, 0.5)",
								},
							],
						}),
						[theme, dataPoints, labels],
					)}
				/>
			</div>
		</div>
	);
}
