let urgentDates = [];
let greetingShown = false;

/**
 * init function to load the content and reset global variables
 *
 * @author Eugen Ferchow
 */
async function renderSummeryTasks() {
    try {
        urgentDates = [];

        const user = await getSummaryAuthUser();

        if (!user) {
            navigateToIndex();
            return;
        }

        await prepareSummaryLoggedInUser(user);
        await getAllTasksData();

        if (!Array.isArray(allTasks)) {
            allTasks = [];
        }

        tasksInBoard();
        tasksInProgress();
        tasksToDo();
        tasksAwaitingFeedback();
        tasksDone();
        tasksUrgent();
        renderLogedUser();
        userGreetings();

        // Nur beim ersten Besuch anzeigen
        if (!greetingShown) {
            greetingResponsive();
            greetingShown = true;
        }
    } catch (error) {
        console.error("Fehler beim Rendern der Summary:", error);
        navigateToIndex();
    }
}


/**
 * Waits until Firebase Auth has checked whether a user is logged in.
 *
 * @returns {Promise<Object|null>} Firebase user or null
 */
function getSummaryAuthUser() {
    return new Promise((resolve) => {
        if (typeof firebase === "undefined" || !firebase.auth) {
            console.warn("Firebase Auth ist nicht verfügbar.");
            resolve(null);
            return;
        }

        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }

            currentUser = user || null;
            resolve(user || null);
        });
    });
}


/**
 * Prepares the global logedInUser array from Firebase Auth.
 *
 * @param {Object} user - Firebase user
 */
async function prepareSummaryLoggedInUser(user) {
    let userProfile = {};

    try {
        if (typeof getUserProfile === "function") {
            userProfile = await getUserProfile();

            if (!userProfile || Array.isArray(userProfile)) {
                userProfile = {};
            }
        }
    } catch (error) {
        console.warn("User-Profil konnte nicht geladen werden. Nutze Fallback:", error);
        userProfile = {};
    }

    logedInUser = [
        {
            uid: user.uid,
            id: user.uid,
            email: user.email || userProfile.email || "guest@guest.org",
            name: userProfile.name || (user.isAnonymous ? "Guest" : ""),
            lastname: userProfile.lastname || "",
            initials: userProfile.initials || (user.isAnonymous ? "G" : ""),
            phone: userProfile.phone || "",
            isGuest: user.isAnonymous,
        },
    ];

    localStorage.setItem("currentUserId", user.uid);
    localStorage.setItem("logedInUser", JSON.stringify(logedInUser));
}


/**
 * Safely returns a task object.
 *
 * Your old project often stores tasks as [task].
 * This helper supports both [task] and task.
 *
 * @param {*} taskEntry
 * @returns {Object|null}
 */
function getTaskObject(taskEntry) {
    if (Array.isArray(taskEntry)) {
        return taskEntry[0] || null;
    }

    if (taskEntry && typeof taskEntry === "object") {
        return taskEntry;
    }

    return null;
}


/**
 * Safely returns the status object of a task.
 *
 * @param {Object|null} task
 * @returns {Object}
 */
function getTaskStatus(task) {
    if (!task || !task.status) {
        return {
            inProgress: false,
            awaitFeedback: false,
            done: false,
        };
    }

    return task.status;
}


/**
 * render amount of tasks depent on length of the the Array
 */
function tasksInBoard() {
    let tasksInBoard = document.getElementById("amount_of_tasks_in_board");

    if (!tasksInBoard) {
        return;
    }

    tasksInBoard.innerHTML = allTasks.length;
}


/**
 * render amount of tasks in progress depent on the counter.
 */
function tasksInProgress() {
    let tasksInProgress = document.getElementById("tasks_in_progress");

    if (!tasksInProgress) {
        return;
    }

    let count = 0;

    for (let i = 0; i < allTasks.length; i++) {
        const task = getTaskObject(allTasks[i]);
        const status = getTaskStatus(task);

        if (status.inProgress === true) {
            count++;
        }
    }

    tasksInProgress.innerHTML = count;
}


/**
 * render amount of tasks in awaiting for feedback depent on the counter.
 */
function tasksAwaitingFeedback() {
    let tasksAwaitingFeedback = document.getElementById("tasks_awaiting_feedback");

    if (!tasksAwaitingFeedback) {
        return;
    }

    let count = 0;

    for (let i = 0; i < allTasks.length; i++) {
        const task = getTaskObject(allTasks[i]);
        const status = getTaskStatus(task);

        if (status.awaitFeedback === true) {
            count++;
        }
    }

    tasksAwaitingFeedback.innerHTML = count;
}


/**
 * render amount of tasks to do depent on the counter.
 */
function tasksToDo() {
    let tasksToDo = document.getElementById("tasks_number_to_do");

    if (!tasksToDo) {
        return;
    }

    let count = 0;

    for (let i = 0; i < allTasks.length; i++) {
        const task = getTaskObject(allTasks[i]);
        const status = getTaskStatus(task);

        if (!status.inProgress && !status.done && !status.awaitFeedback) {
            count++;
        }
    }

    tasksToDo.innerHTML = count;
}


/**
 * render amount done tasks on the counter.
 */
function tasksDone() {
    let tasksDone = document.getElementById("tasks_number_done");

    if (!tasksDone) {
        return;
    }

    let count = 0;

    for (let i = 0; i < allTasks.length; i++) {
        const task = getTaskObject(allTasks[i]);
        const status = getTaskStatus(task);

        if (status.done === true) {
            count++;
        }
    }

    tasksDone.innerHTML = count;
}


/**
 * render amount of urgent tasks depent on the counter.
 * show the next urgent date in the right format (month day, year) with function showDateInRightFormat and sort dates
 */
function tasksUrgent() {
    let urgentTasks = document.getElementById("tasks_number_urgent");
    let nextUrgentDate = document.getElementById("next_urgent_task_date");

    if (!urgentTasks || !nextUrgentDate) {
        return;
    }

    let count = 0;
    urgentDates = [];

    for (let i = 0; i < allTasks.length; i++) {
        const task = getTaskObject(allTasks[i]);

        if (!task) {
            continue;
        }

        if (task.prio === "urgent") {
            count++;

            if (task.date) {
                let rightDate = task.date.replace(/[/]/g, "-");
                urgentDates.push(rightDate);
            }
        }
    }

    urgentTasks.innerHTML = count;

    if (count !== 0 && urgentDates.length > 0) {
        sortDates(urgentDates);
        nextUrgentDate.innerHTML = showDateInRightFormat(urgentDates[0]);
    } else {
        nextUrgentDate.innerHTML = "No urgent dates !";
    }
}


/**
 *
 * @param {string} date
 * @returns {string}
 * brings the tasksUrgent date in right format (month day, year)
 */
function showDateInRightFormat(date) {
    if (!date || typeof date !== "string") {
        return "No urgent dates !";
    }

    let parts = date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    let day = parts[0];
    let month = parts[1];
    let year = parts[2];

    let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    let monthIndex = parseInt(month, 10) - 1;
    let rightMonth = months[monthIndex] || month;

    return `${rightMonth} ${day}, ${year}`;
}


/**
 *
 * @param {Array<string>} urgentDates
 * @returns {Array<string>}
 * sort the urgent dates and bring them in right order
 */
function sortDates(urgentDates) {
    return urgentDates.sort((a, b) => {
        const dateA = a.split("-").reverse().join("-");
        const dateB = b.split("-").reverse().join("-");

        return new Date(dateA) - new Date(dateB);
    });
}


/**
 * render greetings with name and lastname and show the greeting message depent on time
 * with the GreetingDependTime function
 */
function userGreetings() {
    let greetSummaryMain = document.getElementById("greeting-depent-time");
    let name = document.getElementById("logedInName");
    let lastName = document.getElementById("logedInLastname");

    if (!greetSummaryMain) {
        return;
    }

    const user = Array.isArray(logedInUser) && logedInUser[0] ? logedInUser[0] : null;

    if (!user) {
        greetSummaryMain.innerHTML = GreetingDependTime();
        return;
    }

    greetSummaryMain.innerHTML = GreetingDependTime();

    if (user.name !== "Guest") {
        if (name) {
            name.innerHTML = `${user.name || ""} `;
        }

        if (lastName) {
            lastName.innerHTML = `${user.lastname || ""}`;
        }
    } else {
        if (name) {
            name.innerHTML = "";
        }

        if (lastName) {
            lastName.innerHTML = "";
        }
    }
}


/**
 * show greeting message on mobile phones in width size 660 or less depent on time and username
 */
function greetingResponsive() {
    let greetingContainer = document.getElementById("greeting-main-cont-responsive");
    let greeting = document.getElementById("greetings-resposive-user");

    if (!greetingContainer || !greeting) {
        return;
    }

    if (window.innerWidth <= 660) {
        const user = Array.isArray(logedInUser) && logedInUser[0] ? logedInUser[0] : null;

        greetingContainer.style.display = "flex";

        if (!user || user.name === "Guest") {
            greeting.innerHTML = `${GreetingDependTime()}`;
        } else {
            greeting.innerHTML = `${GreetingDependTime()}, <br> <span class="greetingNameMobile"> ${user.name || ""} ${user.lastname || ""} </span>`;
        }

        setTimeout(() => {
            greetingContainer.style.display = "none";
        }, 2000);
    }
}


/**
 *
 * @returns {string}
 * show a greeting message depent on time
 */
function GreetingDependTime() {
    let now = new Date();
    let hour = now.getHours();

    if (hour < 11) {
        return "Good morning";
    } else if (hour < 18) {
        return "Good afternoon";
    } else {
        return "Good evening";
    }
}