const searchTasks = document.getElementById("searchTasks");
const filterSubject = document.getElementById("filterSubject");
const filterPriority = document.getElementById("filterPriority");
const filterStatus = document.getElementById("filterStatus");
const sortTasks = document.getElementById("sortTasks");

let filteredTaskData = [];

async function applyTaskFilters() {
    let tasks = [...filteredTaskData];
    const searchValue = searchTasks.value.trim().toLowerCase();

    if (searchValue) {
        tasks = tasks.filter(task =>
            (task.title || "").toLowerCase().includes(searchValue) ||
            (task.subject || "").toLowerCase().includes(searchValue) ||
            (task.description || "").toLowerCase().includes(searchValue)
        );
    }

    if (filterSubject.value !== "ALL") {
        tasks = tasks.filter(task => task.subject === filterSubject.value);
    }

    if (filterPriority.value !== "ALL") {
        tasks = tasks.filter(task => task.priority === filterPriority.value);
    }

    if (filterStatus.value !== "ALL") {
        tasks = tasks.filter(task => task.status === filterStatus.value);
    }

    if (sortTasks.value === "DEADLINE") {
        tasks.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
    }

    if (sortTasks.value === "PRIORITY") {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        tasks.sort((a, b) =>
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
    }

    if (sortTasks.value === "RISK") {
        const tasksWithRisk = [];
        for (const task of tasks) {
            try {
                const response = await fetch(`${API_URL}/${task.id}/risk`);
                if (response.ok) {
                    const risk = await response.json();
                    tasksWithRisk.push({ task, riskScore: risk.riskScore });
                }
            } catch (error) {
                console.error(error);
            }
        }
        tasksWithRisk.sort((a, b) => b.riskScore - a.riskScore);
        tasks = tasksWithRisk.map(item => item.task);
    }

    displayTasks(tasks);
}

function updateTaskFilters(tasks) {
    filteredTaskData = tasks;

    const subjects = [...new Set(
        tasks.map(task => task.subject).filter(Boolean)
    )].sort();

    filterSubject.innerHTML = '<option value="ALL">All Subjects</option>';

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        filterSubject.appendChild(option);
    });
}

searchTasks.addEventListener("input", applyTaskFilters);
filterSubject.addEventListener("change", applyTaskFilters);
filterPriority.addEventListener("change", applyTaskFilters);
filterStatus.addEventListener("change", applyTaskFilters);
sortTasks.addEventListener("change", applyTaskFilters);
