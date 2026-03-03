package se.sprout.poc_template_backend.config;


public class ConnectionStringHolder {
    private final String jdbcUrl;
    private final String username;
    private final String password;

    public ConnectionStringHolder(String connectionString) {
        String[] a = connectionString.split("://");
        String schema = a[0];

        String[] b = a[1].split("@");

        String[] usernamePassword = b[0].split(":");
        String username = usernamePassword[0];
        String password = usernamePassword[1];

        String url = b[1];


        this.jdbcUrl = "jdbc:" + schema + "://" + url;
        this.username = username;
        this.password = password;
    }

    public String getJdbcUrl() {
        return jdbcUrl;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }
}
