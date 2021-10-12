package com.example.springsecuritytest.domain.repository;

import com.example.springsecuritytest.domain.entity.BbsEntity;
import com.example.springsecuritytest.domain.entity.CategoryEntity;
import com.example.springsecuritytest.domain.entity.MemberEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BbsRepository extends JpaRepository<BbsEntity, Long> {

    Page<BbsEntity> findByCategoryIdAndBbsTitleContainingIgnoreCase(Pageable pageable, CategoryEntity category, String keyword);
    Page<BbsEntity> findByCategoryIdAndBbsWriter(Pageable pageable, CategoryEntity category, MemberEntity member);
    Page<BbsEntity> findByCategoryId(CategoryEntity category, Pageable pageable);
    Optional<BbsEntity> findById(Long id);
    void deleteById(Long id);
}
