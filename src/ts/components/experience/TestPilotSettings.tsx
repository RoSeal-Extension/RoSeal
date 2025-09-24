import {
	getSelectedTestPilotProgram,
	listTestPilotPrograms,
	updateSelectedTestPilotProgram,
} from "src/ts/helpers/requests/services/account";
import usePromise from "../hooks/usePromise";
import Popover from "../core/Popover";
import Button from "../core/Button";
import MdOutlineScienceOff from "@material-symbols/svg-400/outlined/science_off-fill.svg";
import MdOutlineExperiment from "@material-symbols/svg-400/outlined/experiment-fill.svg";
import { useMemo } from "preact/hooks";
import classNames from "classnames";
import TestPilotProgram from "./TestPilotProgram";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ExperienceTestPilotSettingsProps = {
	container: HTMLDivElement;
};

export default function ExperienceTestPilotSettings({
	container,
}: ExperienceTestPilotSettingsProps) {
	const [programs] = usePromise(() => listTestPilotPrograms().then((data) => data.betaPrograms));
	const [selectedProgramId, , , , setSelectedProgramId] = usePromise(() =>
		getSelectedTestPilotProgram().then((data) => data.optIn?.programId),
	);
	const selectedProgram = useMemo(() => {
		if (!programs || !selectedProgramId) return;

		return programs?.find((program) => program.id === selectedProgramId);
	}, [programs, selectedProgramId]);

	if (!programs?.length) return null;

	return (
		<Popover
			trigger="click"
			className="test-pilot-settings-container"
			container={container}
			placement="auto"
			button={
				<Button
					className={classNames("test-pilot-programs-btn custom-join-btn", {
						selected: selectedProgram,
					})}
					type={selectedProgram ? "growth" : "control"}
				>
					{selectedProgram ? (
						<MdOutlineExperiment className="roseal-icon" />
					) : (
						<MdOutlineScienceOff className="roseal-icon" />
					)}
				</Button>
			}
		>
			<div className="test-pilot-settings">
				<ul className="test-pilot-programs">
					{programs.map((program) => (
						<TestPilotProgram
							program={program}
							active={program === selectedProgram}
							setActive={() => {
								setSelectedProgramId(program.id);
								updateSelectedTestPilotProgram({
									programId: program.id,
								});
							}}
						/>
					))}
					<TestPilotProgram
						active={!selectedProgram}
						setActive={() => {
							setSelectedProgramId("");
							updateSelectedTestPilotProgram({
								programId: "",
							});
						}}
					/>
				</ul>
				{selectedProgram?.testingInstructions && (
					<div className="testing-instructions-container">
						<div>
							<span className="font-bold">
								{getMessage("testPilotSettings.testingInstructions.title")}
							</span>
						</div>
						<p className="text">{selectedProgram.testingInstructions}</p>
					</div>
				)}
			</div>
		</Popover>
	);
}
