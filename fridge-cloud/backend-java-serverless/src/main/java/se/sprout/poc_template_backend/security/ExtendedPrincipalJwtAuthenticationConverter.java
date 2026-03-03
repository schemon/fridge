package se.sprout.poc_template_backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Collection;
import java.util.Collections;

public class ExtendedPrincipalJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final Logger log = LoggerFactory.getLogger(ExtendedPrincipalJwtAuthenticationConverter.class);
    private final JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        try {
            log.debug("Converting JWT to ExtendedPrincipal - Subject: {}, Claims: {}",
                    jwt.getSubject(), jwt.getClaims().keySet());
            Collection<GrantedAuthority> authorities = authoritiesConverter.convert(jwt);
            if (authorities == null) {
                authorities = Collections.emptyList();
            }
            log.debug("JWT conversion successful - Authorities: {}", authorities);
            return new ExtendedPrincipalAuthenticationToken(jwt, authorities, new ExtendedPrincipal(jwt));
        } catch (Exception e) {
            log.error("Error converting JWT to ExtendedPrincipal", e);
            throw e;
        }
    }
}
