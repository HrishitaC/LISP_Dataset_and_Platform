(() => {


    // Fallback-UUID-Function for outdated browsers
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                  v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    const logger = {
        sessionID: null,
        logs: [],

        init() {
            const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : generateUUID();

            this.sessionID = localStorage.getItem('sessionID') || uuid;
            localStorage.setItem('sessionID', this.sessionID);

            const storedLogs = localStorage.getItem('sessionLogs');
            this.logs = storedLogs ? JSON.parse(storedLogs) : [];
        },
        
        logEvent(type, details = {}) {
            const event = {
                type,
                timestamp: new Date().toISOString(),
                sessionID: this.sessionID,
                ...details
            };
            console.log("[LOG]", event);
            this.logs.push(event);
            localStorage.setItem('sessionLogs', JSON.stringify(this.logs));
        },

        sendLogs() {
            if (this.logs.length === 0) return;

            return fetch('/log_session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.sessionID,
                    logs: this.logs
                })
            }).then(response => {
                if (response.ok) {
                    console.log('Logs successfully sent to server.');
                    localStorage.removeItem('sessionLogs');
                    localStorage.removeItem('sessionID');
                    localStorage.removeItem('submittedQuery');
                    this.logs = [];
                } else {
                    console.error('Failed to send logs.');
                }
            });
        }
    };

    logger.init();
    window.studyLogger = logger;
})();

const idform = document.getElementById("enter-id-form");
if (idform) {
  idform.addEventListener("submit", (e) => {
    const uid = document.getElementById("id-box").value;
    studyLogger.logEvent("idSubmitted", { uid });
  });
}

const taskbtn = document.getElementById("task-btn")
if (taskbtn) {
    const wrapper = document.getElementById("task-wrapper");
    const userId = wrapper.getAttribute("data-user-id");
    const tasknum = wrapper.getAttribute("data-task-num");
    const topictext = wrapper.getAttribute("data-topic");
    taskbtn.addEventListener("click", () => {
        studyLogger.logEvent("TaskStarted", {
            task: tasknum,
            uid: userId,
            topic: topictext
        });
    });
}

const searchbox = document.getElementById("search-box")
if (searchbox) {
    searchbox.addEventListener("focus", () => {
        studyLogger.logEvent("queryBoxFocused");
    });
}

const searchbar = document.getElementById("search-bar")
if (searchbar) {
    searchbar.addEventListener("submit", (e) => {
        const query = document.getElementById("search-box").value;
        localStorage.setItem("submittedQuery", query);
        studyLogger.logEvent("querySubmitted", { 
            query: query, 
        });
    }); 
}

const searchResults = document.querySelectorAll("article.content-section");
if (searchResults)  {
    const query =  localStorage.getItem('submittedQuery');
    searchResults.forEach(result => {
        const docid = result.getAttribute("base_ir");
        const rank = result.getAttribute("result_rank");
        const url = result.getAttribute("url");  
        studyLogger.logEvent("searchResultGenerated", {
                query: query,
                docid: docid,
                rank: rank,
                url: url
            });
        });
}

const resultLinks = document.querySelectorAll("a.result-link");
if (resultLinks) {
    resultLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const url = link.getAttribute("href");
            const query = localStorage.getItem('submittedQuery');
            const rank = link.getAttribute("result_rank");
            studyLogger.logEvent("clickedResult", {
                query: query,
                url: url,
                rank: rank
            });
        });
    });
}

const pageLinks = document.querySelectorAll("a.page-link");
if (pageLinks) {
    pageLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        const clickedLabel = link.textContent.trim();
        const currentPage = parseInt(document.querySelector(".page-item.active a")?.textContent || "0", 10);

        studyLogger.logEvent("pageNavigationClicked", {
        clicked: clickedLabel,
        fromPage: currentPage,
        toPage: getTargetPage(clickedLabel, currentPage)
        });
    });
    });

    function getTargetPage(label, current) {
    if (label.includes("Next")) return current + 1;
    if (label.includes("Previous")) return current - 1;
    const num = parseInt(label, 10);
    return isNaN(num) ? null : num;
    }
}

const arguments = document.querySelectorAll(".toggle-abstract");
if (arguments) {
    document.querySelectorAll(".toggle-abstract").forEach(toggle => {
            toggle.addEventListener("click", () => {
                const index = toggle.getAttribute("data-index");
                const rank = toggle.getAttribute("data-rank");
                const full = document.getElementById(`abstract-full-${index}`);
                const did = toggle.getAttribute("did");

                if (full.classList.contains("d-none")) {
                    studyLogger.logEvent("toggleArgument", {
                        rank: rank,
                        doc: did,
                        action: "expand",
                        doclen: full.textContent.trim().length
                    }); 
                } else {
                    studyLogger.logEvent("toggleArgument", {
                        rank: rank,
                        doc: did,
                        action: "reduce",
                        doclen: full.textContent.trim().length
                    }); 
                }
            });
    });
}

const pcbuttons = document.querySelectorAll('button[data-type="pro"], button[data-type="con"]');
if(pcbuttons) {
    pcbuttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const type = btn.getAttribute("data-type")
            const rank = btn.getAttribute("data-rank");
            const index = btn.getAttribute("data-index");
            const full = document.getElementById(`abstract-full-${index}`);
            const did = btn.getAttribute("did");
            const currentState = argumentSelections[did];
            if (currentState === type) {
                studyLogger.logEvent("StanceClicked", {
                rank: rank,
                stance: type,
                action: "chooseStance",
                doc: did,
                doclen: full.textContent.trim().length
            });
            } else {
                studyLogger.logEvent("StanceClicked", {
                rank: rank,
                stance: type,
                action: "removeStance",
                doc: did,
                doclen: full.textContent.trim().length
            });
            }
            
        })
    })
}


endtask = document.getElementById("end-task-btn")
if (endtask) {
    endtask.addEventListener("click", () => {
        studyLogger.logEvent("ClickedEndTask");
    });
}

endyes = document.getElementById("yes-end-btn")
if (endyes) {
    endyes.addEventListener("click", () => {
        studyLogger.logEvent("TaskEndConfirmed");
    });
}

feedbackbtn = document.getElementById("feedback-btn")
if (feedbackbtn) {
    feedbackbtn.addEventListener("click", () => {
        const fb = document.getElementById("textarea_feedback").value;
        studyLogger.logEvent("TaskEnded", {
            reason: fb
        });
    });
}

endno = document.getElementById("no-end-btn")
if (endno) {
    endno.addEventListener("click", () => {
        studyLogger.logEvent("TaskContinued");
    });
}

toggleSaved = document.getElementById('toggleSavedLink');
if (toggleSaved) {
    toggleSaved.addEventListener("click", () => {
        studyLogger.logEvent("toggleSavedDocumentsClicked", {
        clicked: getStatus(document.getElementById('savedTitles'))
        }); 
    });

    function getStatus(doclist) {
    if (doclist.style.display == 'none') return "hidden";
    else return "shown";
    }
}

