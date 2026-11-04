package com.fpis.backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "departments")
public class Department {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank @Column(nullable = false, unique = true, length = 120)
    private String name;
    @Column(length = 80)
    private String code;

    protected Department() {}
    public Department(String name, String code) { this.name = name; this.code = code; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public void setName(String name) { this.name = name; }
    public void setCode(String code) { this.code = code; }
}
