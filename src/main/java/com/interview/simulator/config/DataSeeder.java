package com.interview.simulator.config;

import com.interview.simulator.entity.Category;
import com.interview.simulator.entity.Role;
import com.interview.simulator.repository.CategoryRepository;
import com.interview.simulator.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
// this class is used to automatically insert the data into the DB which u do not need to manual added
@Component
public class DataSeeder implements CommandLineRunner {

// CommandLineRunner is an interface provided by the SpringBoot which have the run method.
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        seedRoles();
        seedCategories();
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, Role.RoleName.ROLE_USER));
            roleRepository.save(new Role(null, Role.RoleName.ROLE_ADMIN));
            System.out.println("✅ Roles seeded.");
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new Category(null, "HR Interview",
                    "Behavioral and HR round questions", true, "💼"));
            categoryRepository.save(new Category(null, "Java Backend",
                    "Core Java, OOP, Collections, Multithreading", true, "☕"));
            categoryRepository.save(new Category(null, "Spring Boot",
                    "Spring Boot, REST APIs, JPA, Security", true, "🍃"));
            categoryRepository.save(new Category(null, "DSA",
                    "Data Structures and Algorithms", true, "🧩"));
            categoryRepository.save(new Category(null, "Custom Topic",
                    "Provide your own topic for the interview", true, "✏️"));
            System.out.println("✅ Categories seeded.");
        }
    }
}
