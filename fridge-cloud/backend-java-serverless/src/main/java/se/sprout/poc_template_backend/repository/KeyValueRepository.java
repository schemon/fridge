package se.sprout.poc_template_backend.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import se.sprout.poc_template_backend.repository.model.KeyValue;

@Repository
public interface KeyValueRepository extends CrudRepository<KeyValue, String> {
}
