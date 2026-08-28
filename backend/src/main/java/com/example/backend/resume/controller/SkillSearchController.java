package com.example.backend.resume.controller;

import com.example.backend.resume.repository.SoftwareSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillSearchController {

    private final SoftwareSkillRepository softwareSkillRepository;

    @GetMapping("/search")
    public List<String> searchSkills(@RequestParam(required = false) String searchSkill) {
        if (searchSkill == null || searchSkill.trim().isEmpty()) {
            return softwareSkillRepository.findAllComputerEngineeringSkillNames();
        }
        return softwareSkillRepository.searchComputerEngineeringSkills(searchSkill.trim());
    }
}