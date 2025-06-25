function saveOptions() {
  const timeLimit = document.getElementById("time-limit").value;

  const workBlocked = document
    .getElementById("work-blocked")
    .value.split("\n")
    .filter(Boolean);
  const studyBlocked = document
    .getElementById("study-blocked")
    .value.split("\n")
    .filter(Boolean);
  const focusAllowed = document
    .getElementById("focus-allowed")
    .value.split("\n")
    .filter(Boolean);

  chrome.storage.local.get(null, (data) => {
    // Update settings
    data.settings.timeLimit = parseInt(timeLimit, 10);

    // Update modes
    data.modes.work.blockedSites = workBlocked;
    data.modes.study.blockedSites = studyBlocked;
    data.modes.focus.allowedSites = focusAllowed;

    chrome.storage.local.set(data, () => {
      const status = document.getElementById("status");
      status.textContent = "Settings saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 1500);
    });
  });
}

function restoreOptions() {
  chrome.storage.local.get(null, (data) => {
    document.getElementById("time-limit").value = data.settings.timeLimit;

    document.getElementById("work-blocked").value =
      data.modes.work.blockedSites.join("\n");
    document.getElementById("study-blocked").value =
      data.modes.study.blockedSites.join("\n");
    document.getElementById("focus-allowed").value =
      data.modes.focus.allowedSites.join("\n");
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
