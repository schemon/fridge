package se.sprout.poc_template_backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConnectionStringHolderTest {

    @Test
    void test() {
        String url = "postgresql://username:password@some.example.com/dbname?sslmode=require";
        ConnectionStringHolder actual = new ConnectionStringHolder(url);
        assertEquals("jdbc:postgresql://some.example.com/dbname?sslmode=require", actual.getJdbcUrl());
        assertEquals("username", actual.getUsername());
        assertEquals("password", actual.getPassword());
    }

}
