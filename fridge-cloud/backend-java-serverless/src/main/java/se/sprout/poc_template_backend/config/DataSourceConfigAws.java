package se.sprout.poc_template_backend.config;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.awssdk.services.ssm.model.GetParameterRequest;
import software.amazon.awssdk.services.ssm.model.GetParameterResponse;

import javax.sql.DataSource;

@Configuration
@Profile("aws")
public class DataSourceConfigAws {

    private final Logger log = LoggerFactory.getLogger(DataSourceConfigAws.class);

    @Value("${aws.ssm.datasource.connection.string.name}")
    private String parameterStoreDatasourceUrlName;

    @Bean
    public DataSource getDataSource() {
        log.info("Creating datasource for aws parameter store: " + parameterStoreDatasourceUrlName);
        try (SsmClient ssmClient = SsmClient.builder()
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build()) {

            GetParameterResponse parameter = ssmClient.getParameter(GetParameterRequest.builder()
                    .name(parameterStoreDatasourceUrlName)
                    .withDecryption(true)
                    .build());


            log.info("ssm response: {}", parameter);

            String connectionString = parameter.parameter().value();

            log.info("connectionString: {}", connectionString);

            ConnectionStringHolder connectionStringHolder = new ConnectionStringHolder(connectionString);

            DataSourceBuilder<?> dataSourceBuilder = DataSourceBuilder.create();

            dataSourceBuilder.url(connectionStringHolder.getJdbcUrl());
            dataSourceBuilder.username(connectionStringHolder.getUsername());
            dataSourceBuilder.password(connectionStringHolder.getPassword());

            return dataSourceBuilder.build();
        }

    }
}
