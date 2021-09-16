package com.example.springsecuritytest.domain.repository;

import com.example.springsecuritytest.domain.entity.NoticeEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoticeRepository extends JpaRepository<NoticeEntity, Long> {

    Optional<NoticeEntity> findById(Long id);
    Page<NoticeEntity> findAll(Pageable pageable);
}
