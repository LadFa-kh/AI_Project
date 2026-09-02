package com.example.backend.user.repository;

import com.example.backend.user.entity.UserEntity.Role;
import com.example.backend.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByFullName(String fullname);

    List<UserEntity> findByRole(Role role);

    boolean existsByEmail(String email);
    boolean existsByTelephone(String telephone);


}
