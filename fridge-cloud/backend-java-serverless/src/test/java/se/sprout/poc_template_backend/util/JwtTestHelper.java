package se.sprout.poc_template_backend.util;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

public class JwtTestHelper {

    private final RSAKey rsaKey;
    private final String issuer;

    public JwtTestHelper(String issuer) throws Exception {
        this.issuer = issuer;
        this.rsaKey = new RSAKeyGenerator(2048)
                .keyID("test-key-id")
                .generate();
    }

    public String generateToken(String subject, String email, String username) throws Exception {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 3600 * 1000);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(subject)
                .issuer(issuer)
                .audience("test-audience")
                .expirationTime(expiry)
                .issueTime(now)
                .jwtID(UUID.randomUUID().toString())
                .claim("email", email)
                .claim("username", username)
                .claim("cognito:username", username)
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(rsaKey.getKeyID())
                        .build(),
                claimsSet
        );

        signedJWT.sign(new RSASSASigner(rsaKey));

        return signedJWT.serialize();
    }

    public String generateJwksResponse() {
        Map<String, Object> jwk = rsaKey.toPublicJWK().toJSONObject();
        return "{\"keys\":[" + new com.nimbusds.jose.shaded.gson.Gson().toJson(jwk) + "]}";
    }
}
