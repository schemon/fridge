package se.sprout.poc_template_backend;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import se.sprout.ApiClient;
import se.sprout.api.DevicesApi;
import se.sprout.api.SessionsApi;
import se.sprout.model.DeviceRegistrationRequest;
import se.sprout.model.DeviceRegistrationResponse;
import se.sprout.model.SessionSummary;
import se.sprout.poc_template_backend.util.OauthMock;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        classes = BackendApplication.class)
class DeviceApiKeyIntegrationTest {

    @LocalServerPort
    private int port;

    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    static OauthMock oauthMock = new OauthMock();

    @BeforeAll
    static void beforeAll() throws Exception {
        postgres.start();
        oauthMock.start();
    }

    @AfterAll
    static void afterAll() {
        postgres.stop();
        oauthMock.stop();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", oauthMock::getJwksUrl);
    }

    @Test
    void testDeviceRegistrationViaJwt() throws Exception {
        DevicesApi devicesApi = new DevicesApi(createJwtAuthenticatedApiClient());
        DeviceRegistrationResponse response = devicesApi.adminDevicesPost(
                new DeviceRegistrationRequest().name("test-fridge-1"));

        assertThat(response.getDeviceId()).isNotNull();
        assertThat(response.getName()).isEqualTo("test-fridge-1");
        assertThat(response.getApiKey()).isNotBlank();
    }

    @Test
    void testValidApiKeyAccessesSessions() throws Exception {
        // Register a device via JWT
        DevicesApi devicesApi = new DevicesApi(createJwtAuthenticatedApiClient());
        DeviceRegistrationResponse device = devicesApi.adminDevicesPost(
                new DeviceRegistrationRequest().name("test-fridge-sessions"));

        // Use the API key to access sessions
        ApiClient apiKeyClient = new ApiClient()
                .setScheme("http")
                .setHost("localhost")
                .setPort(port);
        apiKeyClient.setRequestInterceptor(builder ->
                builder.header("X-API-Key", device.getApiKey()));

        SessionsApi sessionsApi = new SessionsApi(apiKeyClient);
        List<SessionSummary> sessions = sessionsApi.sessionsGet();
        assertThat(sessions).hasSize(2);
    }

    @Test
    void testInvalidApiKeyReturns401() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/sessions"))
                .header("X-API-Key", "invalid-key-value")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    void testNoAuthReturns401() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/sessions"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    void testRegisteredKeyWorksForSubsequentRequests() throws Exception {
        // Register device
        DevicesApi devicesApi = new DevicesApi(createJwtAuthenticatedApiClient());
        DeviceRegistrationResponse device = devicesApi.adminDevicesPost(
                new DeviceRegistrationRequest().name("test-fridge-reuse"));

        String apiKey = device.getApiKey();
        HttpClient client = HttpClient.newHttpClient();

        // First request
        HttpRequest request1 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/sessions"))
                .header("X-API-Key", apiKey)
                .GET()
                .build();
        HttpResponse<String> response1 = client.send(request1, HttpResponse.BodyHandlers.ofString());
        assertThat(response1.statusCode()).isEqualTo(200);

        // Second request with same key
        HttpRequest request2 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/stats"))
                .header("X-API-Key", apiKey)
                .GET()
                .build();
        HttpResponse<String> response2 = client.send(request2, HttpResponse.BodyHandlers.ofString());
        assertThat(response2.statusCode()).isEqualTo(200);
    }

    private ApiClient createJwtAuthenticatedApiClient() throws Exception {
        String jwtToken = oauthMock.createJwt("test-user-sub", "test@example.com", "testuser");
        ApiClient apiClient = new ApiClient()
                .setScheme("http")
                .setHost("localhost")
                .setPort(port);
        apiClient.setRequestInterceptor(builder ->
                builder.header("Authorization", "Bearer " + jwtToken));
        return apiClient;
    }
}
