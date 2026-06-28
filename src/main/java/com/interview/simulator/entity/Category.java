package com.interview.simulator.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    // Bug fix: renamed from "isActive" to "active" — same Lombok/Hibernate conflict as User entity
    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "icon_class", length = 50)
    private String iconClass;
}
