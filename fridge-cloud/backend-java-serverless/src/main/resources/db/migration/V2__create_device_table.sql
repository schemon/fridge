CREATE TABLE device (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled      BOOLEAN DEFAULT TRUE
);
CREATE UNIQUE INDEX idx_device_name ON device(name);
