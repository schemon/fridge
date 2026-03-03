package se.sprout.poc_template_backend.security;

import org.springframework.security.oauth2.jwt.Jwt;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

public class ExtendedPrincipal implements Principal {

    private final Jwt jwt;

    public ExtendedPrincipal(Jwt jwt) {
        this.jwt = jwt;
    }

    @Override
    public String getName() {
        return jwt.getSubject();
    }

    public String getUsername() {
        return jwt.getClaimAsString("cognito:username");
    }

    public String getEmail() {
        return jwt.getClaimAsString("email");
    }

    public Map<String, Object> getClaims() {
        return Collections.unmodifiableMap(jwt.getClaims());
    }

    public <T> T getClaim(String claimName, Class<T> type) {
        return jwt.getClaim(claimName);
    }

    Jwt getJwt() {
        return jwt;
    }
}

