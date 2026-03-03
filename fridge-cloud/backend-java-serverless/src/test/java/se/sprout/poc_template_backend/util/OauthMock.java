package se.sprout.poc_template_backend.util;

import com.github.tomakehurst.wiremock.WireMockServer;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

public class OauthMock {

    private WireMockServer wireMockServer;
    private JwtTestHelper jwtTestHelper;
    private String issuerUri;

    public void start() throws Exception {
        wireMockServer = new WireMockServer(0);
        wireMockServer.start();

        int port = wireMockServer.port();
        issuerUri = "http://localhost:" + port;

        jwtTestHelper = new JwtTestHelper(issuerUri);

        wireMockServer.stubFor(get(urlEqualTo("/.well-known/jwks.json"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(jwtTestHelper.generateJwksResponse())));

        String openidConfig = String.format(
            "{\"issuer\":\"%s\",\"jwks_uri\":\"%s/.well-known/jwks.json\"}",
            issuerUri, issuerUri
        );
        wireMockServer.stubFor(get(urlEqualTo("/.well-known/openid-configuration"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(openidConfig)));
    }

    public void stop() {
        if (wireMockServer != null) {
            wireMockServer.stop();
        }
    }

    public String createJwt(String subject, String email, String username) throws Exception {
        return jwtTestHelper.generateToken(subject, email, username);
    }

    public String getJwksUrl() {
        return issuerUri;
    }
}
