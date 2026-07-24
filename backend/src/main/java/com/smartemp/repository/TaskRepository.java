package com.smartemp.repository;

import com.smartemp.model.entity.Task;
import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    long countByStatus(TaskStatus status);

    long countByAssigneeId(Long assigneeId);

    long countByAssigneeIdAndStatus(Long assigneeId, TaskStatus status);

    List<Task> findByAssigneeId(Long assigneeId);

    List<Task> findByProjectId(Long projectId);

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByAssigneeIdAndDueDateBefore(Long assigneeId, LocalDate date);

    @Query("""
                   SELECT t FROM Task t WHERE
                   (:search IS NULL OR :search = '' OR
                    LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
                   AND (:status IS NULL OR t.status = :status)
                   AND (:priority IS NULL OR t.priority = :priority)
                   AND (:department IS NULL OR :department = '' OR
            t.assignee.department = :department)
                   AND (:projectId IS NULL OR t.project.id = :projectId)
                   AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
                   AND (:dueBefore IS NULL OR t.dueDate <= :dueBefore)
                   AND (:dueAfter IS NULL OR t.dueDate >= :dueAfter)
                   """)
    Page<Task> searchTasks(@Param("search") String search,
            @Param("status") TaskStatus status,
            @Param("priority") Priority priority,
            @Param("department") String department,
            @Param("projectId") Long projectId,
            @Param("assigneeId") Long assigneeId,
            @Param("dueBefore") LocalDate dueBefore,
            @Param("dueAfter") LocalDate dueAfter,
            Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :employeeId ORDER BY t.dueDate ASC")
    List<Task> findUpcomingByEmployee(@Param("employeeId") Long employeeId);
}
