const API_URL = "http://a46f5ac3edf784fb79c0e2497a55ec96-2030591016.us-east-1.elb.amazonaws.com:8081/api/tasks";
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const highRiskTasks = document.getElementById("highRiskTasks");

let editingTaskId = null;


/* =========================
   LOAD TASKS
   ========================= */

async function loadTasks() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }

        const tasks = await response.json();

          if (typeof updateTaskFilters === "function") {
              updateTaskFilters(tasks);
          }

          if (typeof updateWorkloadAnalytics === "function") {
              updateWorkloadAnalytics(tasks);
          }

        await updateDashboard(tasks);
        await displayTasks(tasks);

    } catch (error) {

        console.error(error);

        taskList.innerHTML = `
            <div class="task">
                <p style="color:#c43d3d;">
                    Unable to connect to the backend.
                    Make sure Spring Boot is running on port 8081.
                </p>
            </div>
        `;
    }
}


/* =========================
   DASHBOARD
   ========================= */

async function updateDashboard(tasks) {

    totalTasks.textContent = tasks.length;

    const pending = tasks.filter(
        task => task.status !== "COMPLETED"
    );

    const completed = tasks.filter(
        task => task.status === "COMPLETED"
    );

    pendingTasks.textContent = pending.length;
    completedTasks.textContent = completed.length;

    let highRiskCount = 0;

    for (const task of tasks) {

        try {

            const response = await fetch(
                `${API_URL}/${task.id}/risk`
            );

            if (!response.ok) {
                continue;
            }

            const risk = await response.json();

            if (risk.riskLevel === "HIGH") {
                highRiskCount++;
            }

        } catch (error) {
            console.error(error);
        }
    }

    highRiskTasks.textContent = highRiskCount;
}


/* =========================
   DISPLAY TASKS
   ========================= */

async function displayTasks(tasks) {

    if (tasks.length === 0) {

        taskList.innerHTML = `
            <div class="task">
                <p style="color:#718096;">
                    No tasks yet. Add your first task above.
                </p>
            </div>
        `;

        return;
    }

    taskList.innerHTML = "";

    for (const task of tasks) {

        let risk = null;

        try {

            const response = await fetch(
                `${API_URL}/${task.id}/risk`
            );

            if (response.ok) {
                risk = await response.json();
            }

        } catch (error) {
            console.error(error);
        }


        const taskElement = document.createElement("div");

        taskElement.className = "task";


        const riskClass = risk
            ? `risk-${risk.riskLevel.toLowerCase()}`
            : "";


        const completedClass =
            task.status === "COMPLETED"
                ? "task-completed"
                : "";


        taskElement.innerHTML = `

            <div class="task-header">

                <div class="task-title ${completedClass}">
                    ${escapeHTML(task.title)}
                </div>

                ${
                    risk
                        ? `
                        <span class="badge ${riskClass}">
                            ${risk.riskLevel} RISK
                        </span>
                        `
                        : ""
                }

            </div>


            <div class="task-subject">
                ${escapeHTML(task.subject || "No subject")}
            </div>


            <div class="task-description">
                ${escapeHTML(
                    task.description || "No description provided."
                )}
            </div>


            <div class="task-meta">

                <span class="badge">
                    Due: ${task.deadline || "No deadline"}
                </span>

                <span class="badge">
                    ${task.priority || "MEDIUM"} Priority
                </span>

                <span class="badge">
                    ${task.estimatedHours || 0} hours
                </span>

                <span class="badge">
                    ${formatStatus(task.status)}
                </span>

                ${
                    risk
                        ? `
                        <span class="badge ${riskClass}">
                            Score: ${risk.riskScore}
                        </span>

                        <span class="badge">
                            ${risk.recommendation}
                        </span>
                        `
                        : ""
                }

            </div>


            <div class="task-actions">

                ${
                    task.status !== "COMPLETED"
                        ? `
                        <button
                            class="complete-btn"
                            onclick="completeTask(${task.id})"
                        >
                            ✓ Mark Complete
                        </button>
                        `
                        : `
                        <span class="completed-label">
                            ✓ Completed
                        </span>
                        `
                }


                <button
                    class="edit-btn"
                    onclick="editTask(${task.id})"
                >
                    Edit
                </button>


                <button
                    class="delete-btn"
                    onclick="deleteTask(${task.id})"
                >
                    Delete
                </button>

            </div>
        `;


        taskList.appendChild(taskElement);
    }
}


/* =========================
   ADD / UPDATE TASK
   ========================= */

taskForm.addEventListener("submit", async function(event) {

    event.preventDefault();


    const task = {

        title:
            document.getElementById("title").value.trim(),

        subject:
            document.getElementById("subject").value.trim(),

        description:
            document.getElementById("description").value.trim(),

        deadline:
            document.getElementById("deadline").value,

        priority:
            document.getElementById("priority").value,

        estimatedHours:
            Number(
                document.getElementById("estimatedHours").value
            ),

        status: editingTaskId
            ? document.getElementById("status")
                ? document.getElementById("status").value
                : "TODO"
            : "TODO"
    };


    try {

        let response;


        /* UPDATE */

        if (editingTaskId) {

            response = await fetch(
                `${API_URL}/${editingTaskId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(task)
                }
            );

        }


        /* CREATE */

        else {

            response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(task)
                }
            );

        }


        if (!response.ok) {
            throw new Error("Request failed");
        }


        resetForm();

        await loadTasks();

    } catch (error) {

        console.error(error);

        alert(
            editingTaskId
                ? "Unable to update task."
                : "Unable to add task."
        );
    }

});


/* =========================
   EDIT TASK
   ========================= */

async function editTask(id) {

    try {

        const response = await fetch(
            `${API_URL}/${id}`
        );

        if (!response.ok) {
            throw new Error("Task not found");
        }

        const task = await response.json();


        editingTaskId = id;


        document.getElementById("title").value =
            task.title || "";

        document.getElementById("subject").value =
            task.subject || "";

        document.getElementById("description").value =
            task.description || "";

        document.getElementById("deadline").value =
            task.deadline || "";

        document.getElementById("priority").value =
            task.priority || "MEDIUM";

        document.getElementById("estimatedHours").value =
            task.estimatedHours || "";


        const submitButton =
            taskForm.querySelector("button[type='submit']");

        submitButton.textContent = "Update Task";


        let cancelButton =
            document.getElementById("cancelEdit");


        if (!cancelButton) {

            cancelButton = document.createElement("button");

            cancelButton.type = "button";
            cancelButton.id = "cancelEdit";
            cancelButton.className = "cancel-btn";
            cancelButton.textContent = "Cancel";

            cancelButton.onclick = resetForm;

            taskForm.appendChild(cancelButton);
        }


        document.querySelector(".task-form-section")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


    } catch (error) {

        console.error(error);

        alert("Unable to load task for editing.");
    }
}


/* =========================
   RESET FORM
   ========================= */

function resetForm() {

    editingTaskId = null;

    taskForm.reset();

    document.getElementById("priority").value = "MEDIUM";


    const submitButton =
        taskForm.querySelector("button[type='submit']");

    submitButton.textContent = "Add Task";


    const cancelButton =
        document.getElementById("cancelEdit");

    if (cancelButton) {
        cancelButton.remove();
    }
}


/* =========================
   COMPLETE TASK
   ========================= */

async function completeTask(id) {

    try {

        const response = await fetch(
            `${API_URL}/${id}`
        );

        if (!response.ok) {
            throw new Error("Task not found");
        }

        const task = await response.json();

        task.status = "COMPLETED";


        const updateResponse = await fetch(
            `${API_URL}/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(task)
            }
        );


        if (!updateResponse.ok) {
            throw new Error("Failed to complete task");
        }


        await loadTasks();

    } catch (error) {

        console.error(error);

        alert("Unable to complete this task.");
    }
}


/* =========================
   DELETE TASK
   ========================= */

async function deleteTask(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {
            throw new Error("Failed to delete task");
        }


        await loadTasks();

    } catch (error) {

        console.error(error);

        alert("Unable to delete this task.");
    }
}


/* =========================
   HELPERS
   ========================= */

function formatStatus(status) {

    if (status === "IN_PROGRESS") {
        return "In Progress";
    }

    if (status === "COMPLETED") {
        return "Completed";
    }

    return "To Do";
}


function escapeHTML(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


loadTasks();
/* =========================
   SMART RECOMMENDATION
   ========================= */

function buildRecommendationReason(task) {

    const reasons = [];

    if (task.priority === "HIGH") {
        reasons.push("High priority");
    } else if (task.priority === "MEDIUM") {
        reasons.push("Medium priority");
    }

    if (task.deadline) {
        const today = new Date();
        const deadline = new Date(task.deadline);
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            reasons.push("Deadline has passed");
        } else if (daysLeft <= 1) {
            reasons.push("Due very soon");
        } else if (daysLeft <= 3) {
            reasons.push("Deadline approaching");
        }
    }

    if (task.estimatedHours >= 8) {
        reasons.push("Large estimated workload");
    } else if (task.estimatedHours >= 4) {
        reasons.push("Significant estimated workload");
    }

    if (reasons.length === 0) {
        reasons.push("Based on the current task workload");
    }

    return reasons.join(" + ");
}

async function loadRecommendedTask() {

    const container = document.getElementById("recommendedTask");
    const riskBadge = document.getElementById("recommendationRisk");

    if (!container || !riskBadge) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/recommended`);

        if (response.status === 204) {

            riskBadge.textContent = "All Clear";
            riskBadge.className = "badge risk-low";

            container.innerHTML = `
                <p class="recommendation-loading">
                    No pending tasks. You're all caught up!
                </p>
            `;

            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load recommendation");
        }

        const task = await response.json();

        const riskClass =
            `risk-${task.riskLevel.toLowerCase()}`;

        riskBadge.textContent =
            `${task.riskLevel} RISK`;

        riskBadge.className =
            `badge ${riskClass}`;

        const recommendationReason = buildRecommendationReason(task);

        container.innerHTML = `

            <div class="recommendation-content">

                <div class="recommendation-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="recommendation-subject">
                    ${escapeHTML(task.subject || "No subject")}
                </div>

                <div class="recommendation-meta">

                    <span class="badge">
                        Due: ${task.deadline || "No deadline"}
                    </span>

                    <span class="badge">
                        ${task.priority || "MEDIUM"} Priority
                    </span>

                    <span class="badge">
                        ${task.estimatedHours || 0} hours
                    </span>

                    <span class="badge ${riskClass}">
                        Risk Score: ${task.riskScore}
                    </span>

                </div>

                <div class="recommendation-action">
                    Recommendation: ${task.recommendation}
                </div>

                <div class="recommendation-reason">
                    Why this task: ${recommendationReason}
                </div>

            </div>
        `;

    } catch (error) {

        console.error(error);

        riskBadge.textContent = "Unavailable";
        riskBadge.className = "badge";

        container.innerHTML = `
            <p class="recommendation-loading">
                Unable to load task recommendation.
            </p>
        `;
    }
}



/* =========================
   WORKLOAD ANALYTICS
   ========================= */

function updateWorkloadAnalytics(tasks) {

    let total = 0;
    let pending = 0;
    let completed = 0;

    tasks.forEach(task => {

        const hours = Number(task.estimatedHours) || 0;

        total += hours;

        if (task.status === "COMPLETED") {
            completed += hours;
        } else {
            pending += hours;
        }
    });

    document.getElementById("totalHours").textContent = total;
    document.getElementById("pendingHours").textContent = pending;
    document.getElementById("completedHours").textContent = completed;

    const completionRate = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    document.getElementById("completionRate").textContent = completionRate;
}

loadRecommendedTask();
