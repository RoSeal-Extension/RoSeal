document.documentElement.setAttribute(
	"data-roseal-data",
	JSON.stringify({
		extensionId: browser.runtime.id,
		version: import.meta.env.VERSION,
		target: import.meta.env.TARGET,
	}),
);
