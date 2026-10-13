package com.fixhub.common.auth.bootstrap;

public interface AdminBootstrapService {

    boolean bootstrapAdmin();

    boolean bootstrapAdmin(String email, String password, String fullName);
}
