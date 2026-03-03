package se.sprout.poc_template_backend.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public class DeviceAuthenticationToken extends AbstractAuthenticationToken {

    private final DevicePrincipal principal;

    public DeviceAuthenticationToken(DevicePrincipal principal) {
        super(List.of(new SimpleGrantedAuthority("ROLE_DEVICE")));
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public DevicePrincipal getPrincipal() {
        return principal;
    }
}
