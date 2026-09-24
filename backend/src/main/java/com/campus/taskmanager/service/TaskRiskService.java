package com.campus.taskmanager.service;

import com.campus.taskmanager.model.Task;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class TaskRiskService {

    public int calculateRiskScore(Task task) {

        if (task.getStatus() == Task.Status.COMPLETED) {
            return 0;
        }

        int score = 0;

        // Deadline factor
        if (task.getDeadline() != null) {
            long daysLeft = ChronoUnit.DAYS.between(
                    LocalDate.now(),
                    task.getDeadline()
            );

            if (daysLeft < 0) {
                score += 50;
            } else if (daysLeft <= 1) {
                score += 40;
            } else if (daysLeft <= 3) {
                score += 30;
            } else if (daysLeft <= 7) {
                score += 20;
            } else {
                score += 10;
            }
        }

        // Priority factor
        if (task.getPriority() == Task.Priority.HIGH) {
            score += 30;
        } else if (task.getPriority() == Task.Priority.MEDIUM) {
            score += 20;
        } else if (task.getPriority() == Task.Priority.LOW) {
            score += 10;
        }

        // Estimated effort factor
        if (task.getEstimatedHours() != null) {
            if (task.getEstimatedHours() >= 8) {
                score += 20;
            } else if (task.getEstimatedHours() >= 4) {
                score += 15;
            } else if (task.getEstimatedHours() >= 2) {
                score += 10;
            } else {
                score += 5;
            }
        }

        return Math.min(score, 100);
    }

    public String getRiskLevel(int score) {

        if (score >= 70) {
            return "HIGH";
        } else if (score >= 40) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    public String getRecommendation(Task task, int score) {

        if (task.getStatus() == Task.Status.COMPLETED) {
            return "Task completed";
        }

        if (score >= 70) {
            return "Start Now";
        } else if (score >= 40) {
            return "Plan Soon";
        } else {
            return "Can Be Scheduled";
        }
    }
}
