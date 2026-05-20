let urgentDates = [];
let greetingShown = false;

/**
 * init function to load the content and reset global variables
 *
 * @author Eugen Ferchow
 */
async function renderSummeryTasks() {
    await getAllTasksData()
    logedInUser = await getItemContacts("logedInUser");
    if (logedInUser.length == 0) {
        navigateToIndex();
    }
    tasksInBoard();
    tasksInProgress();
    tasksToDo();
    tasksAwaitingFeedback()
    tasksDone();
    tasksUrgent();
    renderLogedUser();
    userGreetings();
    // Nur beim ersten Besuch anzeigen
    if (!greetingShown) {
        greetingResponsive();
        greetingShown = true;
    }
}


/**
 * render amount of tasks depent on length of the the Array
 */
function tasksInBoard() {
    let tasksInBoard = document.getElementById('amount_of_tasks_in_board');
    tasksInBoard.innerHTML = allTasks.length;
}


/**
 * render amount of tasks in progress depent on the counter.
 */
function tasksInProgress() {
    let tasksInProgress = document.getElementById('tasks_in_progress');
    let count = 0;
    for (let i = 0; i < allTasks.length; i++) {
        const element = allTasks[i][0];
        if (element.status.inProgress == true)
            count++
        tasksInProgress.innerHTML = count;
    }
}


/**
 * render amount of tasks in awaiting for feedback depent on the counter.
 */
function tasksAwaitingFeedback() {
    let tasksAwaitingFeedback = document.getElementById('tasks_awaiting_feedback');
    let count = 0;
    for (let i = 0; i < allTasks.length; i++) {
        const element = allTasks[i][0];
        if (element.status.awaitFeedback == true)
            count++
        tasksAwaitingFeedback.innerHTML = count;
    }
}


/**
 * render amount of tasks to do depent on the counter.
 */
function tasksToDo() {
    let tasksToDo = document.getElementById('tasks_number_to_do');
    let count = 0;
    for (let i = 0; i < allTasks.length; i++) {
        const element = allTasks[i][0];
        if (!element.status.inProgress && !element.status.done && !element.status.awaitFeedback)
            count++
        tasksToDo.innerHTML = count;
    }
}


/**
 * render amount done tasks on the counter.
 */
function tasksDone() {
    let tasksDone = document.getElementById('tasks_number_done');
    let count = 0;
    for (let i = 0; i < allTasks.length; i++) {
        const element = allTasks[i][0];
        if (element.status.done == true)
            count++
        tasksDone.innerHTML = count;
    }
}


/**
 * render amount of urgent tasks depent on the counter.
 * show the next urgent date in the right format (month day, year) with function showDateInRightFormat and sort dates
 */
function tasksUrgent() {
    let urgentTasks = document.getElementById('tasks_number_urgent');
    let nextUrgentDate = document.getElementById('next_urgent_task_date');
    let count = 0;
    for (let i = 0; i < allTasks.length; i++) {
        const element = allTasks[i][0];
        if (element.prio == "urgent") {
            count++;
            rightDate = element.date.replace(/[/]/g, "-");
            urgentDates.push(rightDate);
            sortDates(urgentDates);
        }
        urgentTasks.innerHTML = count;
    }
    if (count != 0) {
        nextUrgentDate.innerHTML = showDateInRightFormat(urgentDates[0]);
    } else {
        nextUrgentDate.innerHTML = "No urgent dates !"
    }
}


/**
 * 
 * @param {string} date 
 * @returns {string}
 * brings the tasksUrgent date in right format (month day, year)
 */
function showDateInRightFormat(date) {
    let arr = Array.from(date);
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let rightMonth = arr[3] + arr[4];
    if (rightMonth[0] == 0) {
        rightMonth = months[rightMonth[1] - 1];
    }
    else {
        rightMonth = months[rightMonth - 1];
    }
    return `${rightMonth} ${arr[0]}${arr[1]}, ${arr[6]}${arr[7]}${arr[8]}${arr[9]}`
}


/**
 * 
 * @param {string} urgentDates 
 * @returns {string}
 * sort the urgent dates and bring them in right order 
 */
function sortDates(urgentDates) {
    return urgentDates.sort((a, b) => {
        const dateA = a.split('-').reverse().join('-');
        const dateB = b.split('-').reverse().join('-');
        return new Date(dateA) - new Date(dateB);
    });
}


/**
 * render greetings with name and lastname and show the greeting message depent on time 
 * with the GreetingDependTime function
 */
function userGreetings() {
    let greetSummaryMain = document.getElementById('greeting-depent-time');
    let name = document.getElementById('logedInName');
    let lastName = document.getElementById('logedInLastname');
    if (logedInUser[0].name == "Guest") {
        greetSummaryMain.innerHTML = `${GreetingDependTime()}`;
    }
    else {
        greetSummaryMain.innerHTML = `${GreetingDependTime()}`;
        name.innerHTML = `${logedInUser[0].name} `;
        lastName.innerHTML = `${logedInUser[0].lastname}`;
    }
}


/**
 * show greeting message on mobile phones in width size 660 or less depent on time and username
 */
function greetingResponsive() {
    let greetingContainer = document.getElementById('greeting-main-cont-responsive');
    let greeting = document.getElementById('greetings-resposive-user');
    if (window.innerWidth <= 660) {
        greetingContainer.style.display = 'flex';
        if (logedInUser[0].name == "Guest") {
            greeting.innerHTML = `${GreetingDependTime()}`;
        }
        else {
            greeting.innerHTML = `${GreetingDependTime()}, <br> <span class="greetingNameMobile"> ${logedInUser[0].name} ${logedInUser[0].lastname} </span>`
        }
        setTimeout(() => {
            greetingContainer.style.display = 'none';
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
    let hour = now.getHours()
    if (hour < 11) {
        return "Good morning"
    } else if (hour < 18) {
        return "Good afternoon";
    } else if (hour < 24) {
        return "Good evening";
    }
}
