package com.james.app

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) {
        http
                .csrf { it.disable() }
                .headers { it.frameOptions { it.sameOrigin() } }
                .authorizeHttpRequests {
                    it.requestMatchers("/h2-console/**").permitAll()
                            .anyRequest().permitAll()
                }
        return http.build()
    }
}