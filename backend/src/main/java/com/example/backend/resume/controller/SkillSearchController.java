package com.example.backend.resume.controller;

import com.example.backend.resume.repository.SoftwareSkillRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillSearchController {

    private final SoftwareSkillRepository softwareSkillRepository;

    @GetMapping("/search")
    public List<String> searchSkills(@RequestParam(required = false) String searchSkill) {
        if (searchSkill == null || searchSkill.trim().isEmpty()) {
            return softwareSkillRepository.findHotTechnologySkills(PageRequest.of(0, 20));
        }
        if (searchSkill.trim().length() < 2) {
            return Collections.emptyList();
        }
        return softwareSkillRepository.searchSkillNames(searchSkill.trim(), PageRequest.of(0, 15));
    }
}
