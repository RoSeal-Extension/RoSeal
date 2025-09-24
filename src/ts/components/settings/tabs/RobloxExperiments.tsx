import { useState } from "preact/hooks";
import Button from "../../core/Button";
import usePromise from "../../hooks/usePromise";
import {
	type RobloxExperimentVariable,
	getRobloxExperiments,
	type RobloxExperiment,
} from "src/ts/helpers/requests/services/roseal";
import useStorage from "../../hooks/useStorage";
import {
	EXPERIMENTS_STORAGE_KEY,
	type ExperimentsDiscoveredStorageValue,
	EXPERIMENTS_DISCOVERED_STORAGE_KEY,
	type ExperimentsStorageValue,
} from "src/ts/constants/robloxExperiments";
import Dropdown from "../../core/Dropdown";
import useFeatureValue from "../../hooks/useFeatureValue";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type RobloxExperimentsTabProps = {
	type: keyof ExperimentsDiscoveredStorageValue;
	experiments: NonNullable<
		ExperimentsDiscoveredStorageValue[keyof ExperimentsDiscoveredStorageValue]
	>;
};
export function DiscoveredRobloxExperiments({ type, experiments }: RobloxExperimentsTabProps) {
	const entries = Object.entries(experiments);

	return (
		<div className="discovered-section-container">
			<div className="discovered-section-header">
				<h4 className="container-header">
					{getMessage(`robloxExperiments.discovered.${type}.title`)}
				</h4>
			</div>
			<div className="discovered-section-content">
				<table className="table table-striped">
					<thead>
						<tr>
							{type === "ixp" && (
								<th className="text-label">
									{getMessage(`robloxExperiments.discovered.${type}.parentId`)}
								</th>
							)}
							<th className="text-label">
								{getMessage(`robloxExperiments.discovered.${type}.id`)}
							</th>
							<th className="text-label">
								{getMessage(`robloxExperiments.discovered.${type}.parameters`)}
							</th>
						</tr>
					</thead>
					<tbody>
						{entries.map(([parentId, parent]) =>
							Object.entries(parent).map(([id, parameters]) => (
								<tr className="discovered-exp" key={id}>
									{type === "ixp" && (
										<td className="exp-parent-id">{parentId}</td>
									)}
									<td className="exp-id">{id}</td>
									<td className="exp-parameters text">{parameters.join("\n")}</td>
								</tr>
							)),
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export type RobloxExperimentContainerProps = {
	experiment: RobloxExperiment;
	value: string;
	setValue: (value: string) => void;
};

export function RobloxExperimentContainer({
	experiment,
	value,
	setValue,
}: RobloxExperimentContainerProps) {
	const buckets = experiment.buckets.concat({
		id: "control",
		label: getMessage("robloxExperiments.defaultBucket"),
		operations: [],
	});

	return (
		<div className="experiment-container section-content notifications-section">
			<div className="experiment-name-container">
				<div className="btn-toggle-label">{experiment.name}</div>
				<div className="text small">{experiment.id}</div>
				<Dropdown
					className="experiment-dropdown"
					selectionItems={buckets.map((bucket) => ({
						id: bucket.id,
						label: bucket.label,
						value: bucket.id,
					}))}
					onSelect={setValue}
					selectedItemValue={
						buckets.find((bucket) => bucket.id === value)?.id ?? "control"
					}
				/>
			</div>
			<ul className="experiment-buckets-container">
				{buckets.map(
					(bucket) =>
						bucket.description && (
							<li className="experiment-bucket text small" key={bucket.id}>
								{bucket.label}: {bucket.description}
							</li>
						),
				)}
			</ul>
		</div>
	);
}

export default function RobloxExperimentsTab() {
	const [dismissedWarning, setDismissedWarning] = useState(false);
	const [experimentSections] = usePromise(getRobloxExperiments, []);
	const [experimentOverrides, setExperimentOverrides] = useStorage<ExperimentsStorageValue>(
		EXPERIMENTS_STORAGE_KEY,
		{
			settings: {},
			operations: [],
		},
	);
	const [discoveredExperiments, setDiscoveredExperiments] =
		useStorage<ExperimentsDiscoveredStorageValue>(EXPERIMENTS_DISCOVERED_STORAGE_KEY, {});
	const [discoverExperimentsEnabled] = useFeatureValue(
		"overrideRobloxExperiments.discoverExperiments",
		false,
	);

	return dismissedWarning ? (
		<div className="experiments-container">
			<div className="experiment-sections-container">
				<div className="experiment-sections-header">
					<p>{getMessage("robloxExperiments.description")}</p>
				</div>
				<div className="experiment-sections-content">
					{experimentSections?.map((section) => {
						return (
							<div className="experiment-section-container" key={section.id}>
								<div className="experiment-section-header">
									<h3 className="container-header">{section.name}</h3>
								</div>

								<div className="experiment-section-content">
									{section.experiments.map((experiment) => (
										<RobloxExperimentContainer
											experiment={experiment}
											key={experiment.id}
											value={
												experimentOverrides.settings[experiment.id] ||
												"control"
											}
											setValue={(value) => {
												const newOverrides = {
													...experimentOverrides,
													settings: {
														...experimentOverrides.settings,
														[experiment.id]: value,
													},
												};

												const experiments = experimentSections.flatMap(
													(section) => section.experiments,
												);

												for (const key in newOverrides.settings) {
													if (!experiments.find((e) => e.id === key)) {
														delete newOverrides.settings[key];
													}
												}

												if (value === "control") {
													delete newOverrides.settings[experiment.id];
												}

												const newOperations: RobloxExperimentVariable[] =
													[];
												for (const experiment of experiments) {
													const operations = experiment.buckets.find(
														(bucket) =>
															bucket.id ===
															newOverrides.settings[experiment.id],
													)?.operations;

													if (operations) {
														newOperations.push(...operations);
													}
												}
												newOverrides.operations = newOperations;
												setExperimentOverrides(newOverrides);
											}}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
			{discoverExperimentsEnabled && (
				<div className="discovered-sections-container">
					<div className="discovered-sections-header">
						<h3 className="container-header">
							{getMessage("robloxExperiments.discovered.title")}
						</h3>
						<p>{getMessage("robloxExperiments.discovered.description")}</p>
					</div>
					{Object.entries(discoveredExperiments).map(([experimentType, experiments]) => (
						<DiscoveredRobloxExperiments
							key={experimentType}
							type={experimentType as keyof ExperimentsDiscoveredStorageValue}
							experiments={experiments}
						/>
					))}
					<Button
						type="alert"
						className="btn-clear-experiments"
						onClick={() => setDiscoveredExperiments({})}
					>
						{getMessage("robloxExperiments.discovered.clear")}
					</Button>
				</div>
			)}
		</div>
	) : (
		<div className="experiments-warning">
			<div className="warning-info-container">
				<h1 className="warning-title">{getMessage("robloxExperiments.warning.title")}</h1>
				<div className="text warning-text">
					{getMessage("robloxExperiments.warning.description")}
				</div>
				<Button className="btn-warning" onClick={() => setDismissedWarning(true)}>
					{getMessage("robloxExperiments.warning.action")}
				</Button>
			</div>
		</div>
	);
}
