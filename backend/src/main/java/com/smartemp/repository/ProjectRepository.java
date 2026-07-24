package com.smartemp.repository;

import com.smartemp.model.entity.Project;
import com.smartemp.model.enums.Priority;
import com.smartemp.model.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    long countByStatus(ProjectStatus status);

    @Query("""
            SELECT p FROM Project p WHERE
            (:search IS NULL OR :search = '' OR
             LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR p.status = :status)
            AND (:priority IS NULL OR p.priority = :priority)
            AND (:deadlineFrom IS NULL OR p.deadline >= :deadlineFrom)
AND (:deadlineTo IS NULL OR p.deadline <= :deadlineTo)
            """)
    Page<Project> searchProjects(@Param("search") String search,
            @Param("status") ProjectStatus status,
            @Param("priority") Priority priority, @Param("deadlineFrom") LocalDate deadlineFrom,
            @Param("deadlineTo") LocalDate deadlineTo,
            Pageable pageable);

    @Query("SELECT p FROM Project p JOIN p.employees e WHERE e.id = :employeeId")
    List<Project> findByEmployeeId(@Param("employeeId") Long employeeId);
}
