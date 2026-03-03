package se.sprout.poc_template_backend.repository;

import org.springframework.data.repository.CrudRepository;
import se.sprout.poc_template_backend.repository.model.Device;

import java.util.Optional;
import java.util.UUID;

public interface DeviceRepository extends CrudRepository<Device, UUID> {

    Optional<Device> findByApiKeyHashAndEnabledTrue(String apiKeyHash);
}
