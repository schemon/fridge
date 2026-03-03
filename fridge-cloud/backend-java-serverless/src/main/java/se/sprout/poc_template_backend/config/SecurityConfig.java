package se.sprout.poc_template_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import se.sprout.poc_template_backend.repository.DeviceRepository;
import se.sprout.poc_template_backend.security.ApiKeyAuthenticationFilter;
import se.sprout.poc_template_backend.security.ExtendedPrincipalJwtAuthenticationConverter;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final DeviceRepository deviceRepository;

    public SecurityConfig(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .addFilterBefore(new ApiKeyAuthenticationFilter(deviceRepository), BearerTokenAuthenticationFilter.class)
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(List.of("*"));
                configuration.setAllowedMethods(List.of("*"));
                configuration.setAllowedHeaders(List.of("*"));
                return configuration;
            }))
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(request -> request
                    .requestMatchers(HttpMethod.GET, "/api/v1/hello").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/hello/me").authenticated()
                    .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults())
            .oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(new ExtendedPrincipalJwtAuthenticationConverter()))
            )
            .build();
    }

}
