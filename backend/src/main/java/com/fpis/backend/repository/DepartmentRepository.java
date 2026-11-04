package com.fpis.backend.repository;

import com.fpis.backend.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DepartmentRepository extends JpaRepository<Department, Long> { boolean existsByNameIgnoreCase(String name); }
