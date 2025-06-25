// // Function to get today's date in YYYY-MM-DD format
// function getTodayDateString() {
//   return new Date().toISOString().slice(0, 10);
// }

// // 1. INITIALIZATION: Set up default data on first install
// chrome.runtime.onInstalled.addListener((details) => {
//   if (details.reason === "install") {
//     const defaultData = {
//       settings: {
//         activeMode: "work",
//         timeLimit: 30,
//       },
//       modes: {
//         work: {
//           blockedSites: [
//             "instagram.com",
//             "twitter.com",
//             "facebook.com",
//             "youtube.com",
//           ],
//           allowedSites: [],
//         },
//         study: {
//           blockedSites: ["youtube.com", "reddit.com", "imgur.com"],
//           allowedSites: [],
//         },
//         focus: {
//           blockedSites: [],
//           allowedSites: ["docs.google.com", "wikipedia.org", "github.com"],
//         },
//       },
//       timeSpentToday: {
//         date: getTodayDateString(),
//         total: 0,
//         sites: {},
//       },
//     };
//     chrome.storage.local.set(defaultData);
//   }
// });

// // 2. MAIN TIMER: Use alarms to check and track time every minute
// chrome.alarms.create("minuteTick", {
//   periodInMinutes: 1,
// });

// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === "minuteTick") {
//     chrome.storage.local.get(null, (data) => {
//       // Daily Reset Logic
//       const today = getTodayDateString();
//       if (data.timeSpentToday.date !== today) {
//         data.timeSpentToday = {
//           date: today,
//           total: 0,
//           sites: {},
//         };
//       }

//       // Check if the user is on a distracting site
//       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         if (tabs.length === 0) return;

//         const activeTab = tabs[0];
//         if (!activeTab.url || !activeTab.url.startsWith("http")) return;

//         const url = new URL(activeTab.url);
//         const hostname = url.hostname.startsWith("www.")
//           ? url.hostname.substring(4)
//           : url.hostname;

//         const currentMode = data.modes[data.settings.activeMode];
//         if (currentMode && currentMode.blockedSites.includes(hostname)) {
//           // Increment time
//           data.timeSpentToday.total = (data.timeSpentToday.total || 0) + 1;
//           data.timeSpentToday.sites[hostname] =
//             (data.timeSpentToday.sites[hostname] || 0) + 1;

//           // Save updated data
//           chrome.storage.local.set({ timeSpentToday: data.timeSpentToday });
//         }
//       });
//     });
//   }
// });

// // 3. BLOCKING LOGIC: Check every time a tab is updated
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (
//     changeInfo.status !== "loading" ||
//     !tab.url ||
//     !tab.url.startsWith("http")
//   ) {
//     return;
//   }

//   const url = new URL(tab.url);
//   const hostname = url.hostname.startsWith("www.")
//     ? url.hostname.substring(4)
//     : url.hostname;

//   chrome.storage.local.get(null, (data) => {
//     const { settings, modes, timeSpentToday } = data;
//     const activeMode = settings.activeMode;

//     if (activeMode === "off") return;

//     // Focus Mode Logic (Whitelist)
//     if (activeMode === "focus") {
//       if (!modes.focus.allowedSites.includes(hostname)) {
//         chrome.tabs.reload(tabId, function() {
//           chrome.tabs.update(tabId, { url: "blocked.html" });
//         });
//       }
//       return;
//     }

//     // Normal/Study Mode Logic (Blacklist + Timer)
//     const currentMode = modes[activeMode];
//     if (currentMode && currentMode.blockedSites.includes(hostname)) {
//       if (timeSpentToday.total >= settings.timeLimit) {
//         chrome.tabs.update(tabId, { url: "blocked.html" });
//       }
//     }
//   });
// });
//

// Function to get today's date in YYYY-MM-DD format
function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// 1. INITIALIZATION: Set up default data on first install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    const defaultData = {
      settings: {
        activeMode: "work",
        timeLimit: 30,
      },
      modes: {
        work: {
          blockedSites: [
            "instagram.com",
            "twitter.com",
            "facebook.com",
            "youtube.com",
          ],
          allowedSites: [],
        },
        study: {
          blockedSites: ["youtube.com", "reddit.com", "imgur.com"],
          allowedSites: [],
        },
        focus: {
          blockedSites: [],
          allowedSites: ["docs.google.com", "wikipedia.org", "github.com"],
        },
      },
      timeSpentToday: {
        date: getTodayDateString(),
        total: 0,
        sites: {},
      },
    };
    chrome.storage.local.set(defaultData);
  }
  // Set the alarm upon installation
  chrome.alarms.create("minuteTick", { periodInMinutes: 1 });
});

// 2. MAIN TIMER & PROACTIVE BLOCKING: Use alarms to check and act every minute
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "minuteTick") {
    chrome.storage.local.get(null, (data) => {
      const today = getTodayDateString();
      if (data.timeSpentToday.date !== today) {
        data.timeSpentToday = {
          date: today,
          total: 0,
          sites: {},
        };
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (
          tabs.length === 0 ||
          !tabs[0].url ||
          !tabs[0].url.startsWith("http")
        )
          return;

        const activeTab = tabs[0];
        const url = new URL(activeTab.url);
        const hostname = url.hostname.startsWith("www.")
          ? url.hostname.substring(4)
          : url.hostname;

        const { settings, modes } = data;
        const currentMode = modes[settings.activeMode];

        // Time Tracking Logic
        if (currentMode && currentMode.blockedSites.includes(hostname)) {
          data.timeSpentToday.total = (data.timeSpentToday.total || 0) + 1;
          data.timeSpentToday.sites[hostname] =
            (data.timeSpentToday.sites[hostname] || 0) + 1;
          chrome.storage.local.set({ timeSpentToday: data.timeSpentToday });
        }

        // --- NEW PROACTIVE BLOCKING LOGIC ---
        // After tracking, check if the user should be blocked right now.
        if (settings.activeMode !== "focus" && settings.activeMode !== "off") {
          if (data.timeSpentToday.total >= settings.timeLimit) {
            // If time is up, check if the current tab is a blocked site
            if (currentMode && currentMode.blockedSites.includes(hostname)) {
              chrome.tabs.update(activeTab.id, { url: "blocked.html" });
            }
          }
        }
        // --- END OF NEW LOGIC ---
      });
    });
  }
});

// 3. REACTIVE BLOCKING: Check when a tab is updated (for navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ensure we only act on navigations with a URL
  if (!changeInfo.url || !tab.url || !tab.url.startsWith("http")) {
    return;
  }

  const url = new URL(tab.url);
  const hostname = url.hostname.startsWith("www.")
    ? url.hostname.substring(4)
    : url.hostname;

  chrome.storage.local.get(null, (data) => {
    const { settings, modes, timeSpentToday } = data;
    const activeMode = settings.activeMode;

    if (activeMode === "off") return;

    // Focus Mode Logic (Whitelist)
    if (activeMode === "focus") {
      if (!modes.focus.allowedSites.includes(hostname)) {
        chrome.tabs.update(tabId, { url: "blocked.html" });
      }
      return;
    }

    // Normal/Study Mode Logic (Blacklist + Timer)
    const currentMode = modes[activeMode];
    if (currentMode && currentMode.blockedSites.includes(hostname)) {
      if (timeSpentToday.total >= settings.timeLimit) {
        chrome.tabs.update(tabId, { url: "blocked.html" });
      }
    }
  });
});
