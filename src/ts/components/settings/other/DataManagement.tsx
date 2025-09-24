import classNames from "classnames";
import { useState } from "preact/hooks";
import { MAIN_STORAGE_KEYS_SYNC } from "src/ts/constants/storage";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { migrateStorage } from "src/ts/helpers/migrateStorage";
import { storage } from "src/ts/helpers/storage";
import { stringToBase64 } from "src/ts/utils/hex";
import Button from "../../core/Button";
import FileUpload from "../../core/FileUpload";

export default function DataManagement() {
	const [downloadDataStr, setDownloadDataStr] = useState<string>();
	const [fetchingData, setFetchingData] = useState(false);
	const [importFile, setImportFile] = useState<File>();

	const [readImportData, setReadImportData] = useState(false);
	const [hasImportError, setHasImportError] = useState(false);
	const [readingImportData, setReadingImportData] = useState(false);

	return (
		<div className="section data-management-section">
			<div className="container-header">
				<h2>{getMessage("settings.management.data.title")}</h2>
			</div>
			<p>{getMessage("settings.management.data.description")}</p>
			<div className="sections">
				<div className="section">
					<div className="text-emphasis font-bold">
						{getMessage("settings.management.data.import.title")}
					</div>
					<div className="file-upload-container">
						<div className="file-upload-section">
							<FileUpload format=".json" handleFileData={setImportFile} />
							<Button
								type="secondary"
								disabled={!importFile || readingImportData}
								className="import-data-btn"
								onClick={() => {
									setReadingImportData(true);
									setHasImportError(false);
									setReadImportData(false);

									importFile
										?.text()
										.then(async (text) => {
											const migratedData = migrateStorage(
												JSON.parse(text),
												await storage.get(),
											);

											const clearedData: Record<string, unknown> = {};
											for (const key of MAIN_STORAGE_KEYS_SYNC) {
												clearedData[key] = migratedData.newValue[key];
											}
											storage.set(clearedData);
										})
										.then(() => false)
										.catch(() => true)
										.then((error) => {
											setHasImportError(error);
											setReadImportData(true);
											setReadingImportData(false);
										});
								}}
							>
								{getMessage("settings.management.data.import.import")}
							</Button>
						</div>
					</div>
					{readImportData && (
						<span
							className={classNames("import-data-text", {
								"text-success": !hasImportError,
								"text-error": hasImportError,
							})}
						>
							{getMessage(
								`settings.management.data.import.${hasImportError ? "error" : "success"}`,
							)}
						</span>
					)}
				</div>
				<div className="section">
					<div className="text-emphasis font-bold">
						{getMessage("settings.management.data.export.title")}
					</div>
					<Button
						as={downloadDataStr ? "a" : undefined}
						download={!!downloadDataStr}
						className="import-data-btn"
						disabled={fetchingData}
						href={downloadDataStr}
						onClick={() => {
							if (downloadDataStr) return;

							setFetchingData(true);
							storage
								.get(MAIN_STORAGE_KEYS_SYNC)
								.then((data) => stringToBase64(JSON.stringify(data)))
								.then((b64) => {
									setDownloadDataStr(`data:application/json;base64,${b64}`);
									setFetchingData(false);
								});
						}}
						type="secondary"
					>
						{getMessage(
							`settings.management.data.export.${downloadDataStr ? "download" : "request"}`,
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
