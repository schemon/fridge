package se.sprout.poc_template_backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import se.sprout.model.DeviceRegistrationRequest;
import se.sprout.model.DeviceRegistrationResponse;
import se.sprout.poc_template_backend.repository.DeviceRepository;
import se.sprout.poc_template_backend.repository.model.Device;
import se.sprout.poc_template_backend.security.ApiKeyAuthenticationFilter;

import java.security.SecureRandom;
import java.util.Base64;

@RestController
public class DeviceController {

    private final DeviceRepository deviceRepository;

    public DeviceController(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @PostMapping("/api/v1/admin/devices")
    public DeviceRegistrationResponse registerDevice(@RequestBody DeviceRegistrationRequest request) {
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        String rawApiKey = Base64.getUrlEncoder().withoutPadding().encodeToString(keyBytes);

        String hash = ApiKeyAuthenticationFilter.sha256(rawApiKey);

        Device device = new Device();
        device.setName(request.getName());
        device.setApiKeyHash(hash);
        device = deviceRepository.save(device);

        return new DeviceRegistrationResponse()
                .deviceId(device.getId().toString())
                .name(device.getName())
                .apiKey(rawApiKey);
    }
}
