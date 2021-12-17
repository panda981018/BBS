package com.example.springsecuritytest.conf;

import com.example.springsecuritytest.handler.AuthFailureHandler;
import com.example.springsecuritytest.handler.AuthSuccessHandler;
import com.example.springsecuritytest.service.MemberService;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@AllArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private MemberService memberService;
    private PasswordEncoder passwordEncoder;

    @Bean // 핸들러 Bean으로 등록
    public AuthenticationFailureHandler failureHandler() {
        return new AuthFailureHandler();
    }

    @Bean // 핸들러 Bean으로 등록
    public AuthenticationSuccessHandler successHandler() {
        return new AuthSuccessHandler();
    }

    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(memberService).passwordEncoder(passwordEncoder);
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        super.configure(web);
        web.ignoring()
                .antMatchers("/static/**")
                .antMatchers("/resources/**")
                .antMatchers("/fragments/**");
    }

    @Override
    // HttpStatus를 통해 HTTP 요청에 대한 웹 기반 보안을 구성할 수 있다.
    protected void configure(HttpSecurity http) throws Exception {
        // authorizeRequests() : HttpServletRequest에 따라 접근을 제한함.
        http.authorizeRequests()
                .antMatchers("/member/info", "/post/bbs/view").hasAnyRole("ADMIN", "MEMBER")
                .antMatchers("/member/**", "/post/bbs/write/**", "/map/**").hasRole("MEMBER")
                .antMatchers("/admin/**", "/notice/write", "/notice/update", "/notice/delete").hasRole("ADMIN")
                .antMatchers("/**").permitAll()
                .and()
                // 특정 url 패턴은 csrf 해제
                // csrf를 설정해서 사용할 경우, 특정 URL 외부 프로그램 등에서 POST 방식으로 서버에 접근하면 403 에러 발생.
                .csrf()
                .ignoringAntMatchers("/admin/manage/sort/**", "/check/**", "/summernote/**", "/map/**", "/api/**")
                .and()
                .formLogin()
                .loginPage("/login")
                .defaultSuccessUrl("/")
                .failureHandler(failureHandler()) // 실패시 동작할 핸들러 등록
                .successHandler(successHandler()) // 성공시 동작할 핸들러 등록
                .permitAll()
                .and()
                .logout()
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true) // 로그아웃시 세션 제거
                .deleteCookies("JSESSIONID") // 쿠키 제거
                .clearAuthentication(true) // 권한 정보 제거
                .and()
                // 예외가 발생 했을 때 핸들러를 통해서 처리할 수 있다.
                .exceptionHandling().accessDeniedPage("/access-denied");
    }
}
