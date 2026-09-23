package com.example.backend.usage;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface UsageLogRepository extends JpaRepository<UsageLogEntity, UUID> {

    @Query("select coalesce(sum(u.creditsUsed), 0) from UsageLogEntity u where u.user.id = :userId and u.createdAt >= :since")
    long sumCreditsSince(@Param("userId") UUID userId, @Param("since") Instant since);

    @Query("select u from UsageLogEntity u where (:userId is null or u.user.id = :userId) " +
           "and (:action is null or u.action = :action) and u.createdAt >= :from and u.createdAt < :to")
    Page<UsageLogEntity> search(@Param("userId") UUID userId, @Param("action") String action,
                                @Param("from") Instant from, @Param("to") Instant to, Pageable pageable);

    @Query("select u.action, count(u), sum(case when u.success = true then 1 else 0 end), sum(u.creditsUsed) " +
           "from UsageLogEntity u where u.createdAt >= :from and u.createdAt < :to group by u.action")
    List<Object[]> summary(@Param("from") Instant from, @Param("to") Instant to);

    List<UsageLogEntity> findByUser_Id(UUID userId);

    @Modifying
    @Query("update UsageLogEntity u set u.user = null where u.user.id = :userId")
    int anonymizeUser(@Param("userId") UUID userId);

    @Modifying
    @Query("delete from UsageLogEntity u where u.createdAt < :before")
    int deleteOlderThan(@Param("before") Instant before);
}
