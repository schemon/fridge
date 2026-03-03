package se.sprout.poc_template_backend.security;

import java.security.Principal;
import java.util.UUID;

public class DevicePrincipal implements Principal {

    private final UUID deviceId;
    private final String deviceName;

    public DevicePrincipal(UUID deviceId, String deviceName) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
    }

    @Override
    public String getName() {
        return deviceName;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }
}
