document.addEventListener("DOMContentLoaded", () => {
  const modeSelect = document.getElementById("mode-select");
  const timeSpentEl = document.getElementById("time-spent");
  const optionsLink = document.getElementById("options-link");

  // Load current state from storage
  chrome.storage.local.get(null, (data) => {
    if (data.modes) {
      Object.keys(data.modes).forEach((mode) => {
        const option = document.createElement("option");
        option.value = mode;
        option.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        modeSelect.appendChild(option);
      });
    }

    modeSelect.value = data.settings.activeMode || "off";
    timeSpentEl.textContent = data.timeSpentToday.total || 0;
  });

  // Listen for mode changes
  modeSelect.addEventListener("change", (e) => {
    chrome.storage.local.get("settings", (data) => {
      const newSettings = data.settings;
      newSettings.activeMode = e.target.value;
      chrome.storage.local.set({ settings: newSettings });
    });
  });

  // Open options page
  optionsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});
