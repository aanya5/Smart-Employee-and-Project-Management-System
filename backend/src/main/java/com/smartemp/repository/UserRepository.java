package com.smartemp.repository;

import com.smartemp.model.entity.User;
import com.smartemp.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    long countByActiveTrue();

    @Query("""
            SELECT u FROM User u WHERE
            (:search IS NULL OR :search = '' OR
             LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:department IS NULL OR :department = '' OR u.department = :department)
            AND (:role IS NULL OR u.role = :role)
            """)
    Page<User> searchEmployees(@Param("search") String search,
                               @Param("department") String department,
                               @Param("role") Role role,
                               Pageable pageable);
}
