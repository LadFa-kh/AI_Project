package com.example.backend.config;

import com.example.backend.resume.repository.SoftwareSkillRepository;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.parameters.Parameter;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class SwaggerConfig {

    private final SoftwareSkillRepository softwareSkillRepository;

    @Bean
    public OperationCustomizer skillSearchExampleCustomizer() {
        return (Operation operation, HandlerMethod handlerMethod) -> {
            if (!"searchSkills".equals(handlerMethod.getMethod().getName())) {
                return operation;
            }

            List<String> csSkills = softwareSkillRepository.findAllComputerEngineeringSkillNames();
            Parameter searchParam = operation.getParameters().stream()
                    .filter(p -> "searchSkill".equals(p.getName()))
                    .findFirst()
                    .orElse(null);

            if (searchParam != null && !csSkills.isEmpty()) {
                Map<String, Example> examples = new LinkedHashMap<>();
                for (String skill : csSkills) {
                    examples.put(skill, new Example().value(skill));
                }
                searchParam.setExamples(examples);
            }

            return operation;
        };
    }
}