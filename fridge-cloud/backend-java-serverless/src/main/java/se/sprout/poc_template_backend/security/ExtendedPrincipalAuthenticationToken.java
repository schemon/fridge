package se.sprout.poc_template_backend.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;

public class ExtendedPrincipalAuthenticationToken extends JwtAuthenticationToken {

    private final ExtendedPrincipal principal;

    public ExtendedPrincipalAuthenticationToken(Jwt jwt, Collection<GrantedAuthority> authorities, ExtendedPrincipal principal) {
        super(jwt, authorities, principal.getName());
        this.principal = principal;
    }

    @Override
    public ExtendedPrincipal getPrincipal() {
        return principal;
    }
}

