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
import se.sprout.api.HistoryApi;
import se.sprout.api.SessionsApi;
import se.sprout.api.StatsApi;
import se.sprout.model.SessionDetail;
import se.sprout.model.SessionSummary;
import se.sprout.model.Stats;
import se.sprout.poc_template_backend.util.OauthMock;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        classes = BackendApplication.class)
class SessionControllerIntegrationTest {

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
    void testListSessions() throws Exception {
        SessionsApi api = new SessionsApi(createAuthenticatedApiClient());
        List<SessionSummary> sessions = api.sessionsGet();
        assertThat(sessions).hasSize(2);
        assertThat(sessions.get(0).getSessionId()).isEqualTo("sess-001");
        assertThat(sessions.get(1).getSessionId()).isEqualTo("sess-002");
    }

    @Test
    void testGetSession() throws Exception {
        SessionsApi api = new SessionsApi(createAuthenticatedApiClient());
        SessionDetail detail = api.sessionsIdGet("sess-001");
        assertThat(detail.getSessionId()).isEqualTo("sess-001");
        assertThat(detail.getTransactions()).hasSize(3);
        assertThat(detail.getFrames()).hasSize(3);
    }

    @Test
    void testListHistory() throws Exception {
        HistoryApi api = new HistoryApi(createAuthenticatedApiClient());
        List<SessionSummary> history = api.historyGet();
        assertThat(history).hasSize(3);
        assertThat(history.get(0).getStatus().getState()).isEqualTo("done");
    }

    @Test
    void testGetHistorySession() throws Exception {
        HistoryApi api = new HistoryApi(createAuthenticatedApiClient());
        SessionDetail detail = api.historyIdGet("hist-001");
        assertThat(detail.getSessionId()).isEqualTo("hist-001");
        assertThat(detail.getTransactions()).hasSize(2);
    }

    @Test
    void testGetStats() throws Exception {
        StatsApi api = new StatsApi(createAuthenticatedApiClient());
        Stats stats = api.statsGet();
        assertThat(stats.getDiskUsageTotal()).isNotNull();
        assertThat(stats.getDiskUsageTotal().getUsedBytes()).isGreaterThan(0);
        assertThat(stats.getDiskUsageSessions()).isNotNull();
        assertThat(stats.getDiskUsageHistory()).isNotNull();
    }

    private ApiClient createAuthenticatedApiClient() throws Exception {
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
