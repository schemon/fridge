package se.sprout.poc_template_backend.controller;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import se.sprout.model.HelloResponse;
import se.sprout.poc_template_backend.repository.KeyValueRepository;
import se.sprout.poc_template_backend.repository.model.KeyValue;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.time.Instant;
import se.sprout.poc_template_backend.security.ExtendedPrincipal;

@RestController
public class HelloController {

    private static final Logger log = LoggerFactory.getLogger(HelloController.class);
    private final KeyValueRepository keyValueRepository;

    public HelloController(KeyValueRepository keyValueRepository) {
        this.keyValueRepository = keyValueRepository;
    }

    @GetMapping("/api/v1/hello")
    public HelloResponse hello() {
        log.info("Hello endpoint called (anonymous)");
        KeyValue keyValue = new KeyValue();
        keyValue.setKey("hello-anonymous");
        keyValue.setValue(Instant.now().toString());
        keyValueRepository.save(keyValue);
        KeyValue keyValue1 = keyValueRepository.findById(keyValue.getKey()).orElseThrow();

        return new HelloResponse().value("greetings anonymous at " + keyValue1.getValue());
    }

    @GetMapping("/api/v1/hello/me")
    public HelloResponse helloForUser(@AuthenticationPrincipal ExtendedPrincipal principal) {
        log.info("Hello/me endpoint called - Principal: {}", principal != null ? principal.getName() : "null");
        if (principal != null) {
            log.info("Principal details - Username: {}, Email: {}, Subject: {}",
                    principal.getUsername(), principal.getEmail(), principal.getName());
        }
        KeyValue keyValue = new KeyValue();
        keyValue.setKey("hello-" + principal.getUsername());
        keyValue.setValue(Instant.now().toString());
        keyValueRepository.save(keyValue);
        KeyValue keyValue1 = keyValueRepository.findById(keyValue.getKey()).orElseThrow();

        String username = principal.getUsername();
        String email = principal.getEmail();
        return new HelloResponse().value(
                "greetings " + username + " (email: " + email + ") at " + keyValue1.getValue());
    }
}
