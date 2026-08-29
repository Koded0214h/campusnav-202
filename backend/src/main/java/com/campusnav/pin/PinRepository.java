package com.campusnav.pin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface PinRepository extends JpaRepository<PinSubmission, Long> {
    long countByDeviceIdAndStatus(String deviceId, PinStatus status);
    List<PinSubmission> findByStatusOrderBySubmittedAtDesc(PinStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PinSubmission p where p.id = :id")
    Optional<PinSubmission> findByIdForUpdate(@Param("id") Long id);

    @Query(value = "select pg_advisory_xact_lock(hashtext(:deviceId))", nativeQuery = true)
    void lockDevice(@Param("deviceId") String deviceId);
}
