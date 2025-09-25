export function keepAliveServiceWorker() {
	// Utilize bug to keep service worker alive
	// https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
	const keepAlive = () => setInterval(browser.runtime.getPlatformInfo, 20e3);
	browser.runtime.onStartup.addListener(keepAlive);
	const id = keepAlive();

	return () => {
		clearInterval(id);
		browser.runtime.onStartup.removeListener(keepAlive);
	};
}
