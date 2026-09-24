package com.campus.taskmanager.controller;

import com.campus.taskmanager.model.Task;
import com.campus.taskmanager.service.TaskRiskService;
import com.campus.taskmanager.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;
    private final TaskRiskService taskRiskService;

    public TaskController(
            TaskService taskService,
            TaskRiskService taskRiskService) {

        this.taskService = taskService;
        this.taskRiskService = taskRiskService;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.createTask(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long id,
            @RequestBody Task task) {

        try {
            return ResponseEntity.ok(
                    taskService.updateTask(id, task)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {

        try {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/risk")
    public ResponseEntity<?> getTaskRisk(@PathVariable Long id) {

        return taskService.getTaskById(id)
                .map(task -> {

                    int score = taskRiskService.calculateRiskScore(task);

                    return ResponseEntity.ok(
                            Map.of(
                                    "taskId", task.getId(),
                                    "title", task.getTitle(),
                                    "riskScore", score,
                                    "riskLevel",
                                    taskRiskService.getRiskLevel(score),
                                    "recommendation",
                                    taskRiskService.getRecommendation(task, score)
                            )
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/recommended")
    public ResponseEntity<?> getRecommendedTask() {

        List<Task> tasks = taskService.getAllTasks();

        Task recommendedTask = null;
        int highestScore = -1;

        for (Task task : tasks) {

            if (task.getStatus() == Task.Status.COMPLETED) {
                continue;
            }

            int score = taskRiskService.calculateRiskScore(task);

            if (score > highestScore) {
                highestScore = score;
                recommendedTask = task;
            }
        }

        if (recommendedTask == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(
                Map.of(
                        "taskId", recommendedTask.getId(),
                        "title", recommendedTask.getTitle(),
                        "subject", recommendedTask.getSubject(),
                        "deadline", recommendedTask.getDeadline(),
                        "priority", recommendedTask.getPriority(),
                        "estimatedHours", recommendedTask.getEstimatedHours(),
                        "riskScore", highestScore,
                        "riskLevel",
                        taskRiskService.getRiskLevel(highestScore),
                        "recommendation",
                        taskRiskService.getRecommendation(
                                recommendedTask,
                                highestScore
                        )
                )
        );
    }
}
