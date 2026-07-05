package com.interview.simulator.service;

import com.interview.simulator.entity.Category;
import com.interview.simulator.exception.ResourceNotFoundException;
import com.interview.simulator.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired private CategoryRepository categoryRepository;

    public List<Category> getActiveCategories() {
        return categoryRepository.findByActiveTrue();
    }

    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }

    public void toggleActive(Long id) {
        Category cat = findById(id);
        cat.setActive(!cat.isActive());
        categoryRepository.save(cat);
    }
}
