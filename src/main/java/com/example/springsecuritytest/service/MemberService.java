package com.example.springsecuritytest.service;

import com.example.springsecuritytest.domain.entity.MemberEntity;
import com.example.springsecuritytest.domain.repository.MemberQueryRepository;
import com.example.springsecuritytest.domain.repository.MemberRepository;
import com.example.springsecuritytest.dto.MemberDto;
import com.example.springsecuritytest.enumclass.Gender;
import com.example.springsecuritytest.enumclass.Role;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpSession;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@AllArgsConstructor
public class MemberService implements UserDetailsService {

    private final PasswordEncoder passwordEncoder;
    private final MemberRepository memberRepository;
    private final MemberQueryRepository memberQueryRepository;

    public void signUp(MemberDto memberDto) { // 회원가입

        LocalDateTime now = LocalDateTime.now();
        String time = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String cryptoPassword = passwordEncoder.encode(memberDto.getPassword());

        memberDto.setPassword(cryptoPassword);
        memberDto.setRegDate(time);

        memberRepository.save(memberDto.toEntity());
    }

    public void updateMember(HttpSession session, MemberDto memberDto) { // 회원 정보 update

        Optional<MemberEntity> memberEntity = memberRepository.findByUsername(memberDto.getUsername());

        if (memberEntity.isPresent()) {
            MemberEntity member = memberEntity.get();

            if (memberDto.getPassword().isEmpty()) { // 비밀번호를 수정하지 않은 경우
                memberDto.setId(member.getId());
                memberDto.setPassword(member.getPassword());
            } else { // 비밀번호를 수정한 경우
                String cryptoPassword = passwordEncoder.encode(memberDto.getPassword());
                memberDto.setId(member.getId());
                memberDto.setPassword(cryptoPassword);
            }

            memberDto.setRole(member.getRole() == Role.ADMIN ? Role.ADMIN.getValue() : Role.MEMBER.getValue());
            memberDto.setRegDate(member.getRegDate());

            memberRepository.save(memberDto.toEntity());

            MemberDto myInfo = (MemberDto) session.getAttribute("memberInfo");
            if (myInfo.getRole().equals(Role.MEMBER.getTitle())) {
                session.setAttribute("memberInfo", memberRepository.getById(myInfo.getId()).toDto());
            }
        }
    }

    public MemberDto findByUsername(String username) throws SQLException { // 이름으로 회원정보 get

        Optional<MemberEntity> memberEntity = memberRepository.findByUsername(username);
        if(memberEntity.isPresent()) {
            return memberEntity.get().toDto();
        } else {
            throw new SQLException();
        }
    }

    public MemberDto findById(Long id) throws SQLException {
        Optional<MemberEntity> memberEntity = memberRepository.findById(id);
        if (memberEntity.isPresent()) {
            return memberEntity.get().toDto();
        } else {
            throw new SQLException();
        }
    }

    public Page<MemberEntity> findAllMembers(Pageable pageable) { // 모든 멤버들 리스트 출력
        return memberQueryRepository.findAllExceptAdmin(pageable);
    }

    // 이메일 중복 체크 함수
    public HashMap<String, Boolean> checkEmail(String username) {
        boolean result = memberRepository.existsByUsername(username);
        HashMap<String, Boolean> map = new HashMap<>();
        map.put("result", result);
        return map;
    }

    // 닉네임 중복 체크 함수
    public HashMap<String, Boolean> checkNickname(String id, String nickname, String view) throws SQLException {
        boolean result;

        if (view.equals("myInfo")) {
            result = memberQueryRepository.findByNickname(Long.parseLong(id)).getResults().contains(nickname);
        } else {
            result = memberRepository.existsByNickname(nickname);
        }

        HashMap<String, Boolean> map = new HashMap<>();
        map.put("result", result);
        return map;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Optional<MemberEntity> memberEntity = memberRepository.findByUsername(username);

        if (memberEntity.isPresent()) {
            MemberEntity user = memberEntity.get();

            List<GrantedAuthority> authorities = new ArrayList<>();
            if (user.getRole() == Role.ADMIN) { // admin role을 가지고 있다면
                authorities.add(new SimpleGrantedAuthority(Role.ADMIN.getValue()));
            } else { // member role을 가지고 있다면
                authorities.add(new SimpleGrantedAuthority(Role.MEMBER.getValue()));
            }

            return new User(user.getUsername(), user.getPassword(), authorities);
        } else {
            throw new UsernameNotFoundException(username);
        }
    }
}