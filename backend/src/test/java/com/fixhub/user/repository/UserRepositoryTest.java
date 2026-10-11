package com.fixhub.user.repository;

import com.fixhub.user.entity.AccountStatus;
import com.fixhub.user.entity.Role;
import com.fixhub.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindByEmail_Success() {
        User user = new User("persisted@example.com", "secret_hash", "Persisted User", Role.USER, AccountStatus.PENDING);
        user.setDepartment("Operations");
        user.setDesignation("Coordinator");

        User saved = userRepository.save(user);

        assertNotNull(saved.getId());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());

        Optional<User> found = userRepository.findByEmail("persisted@example.com");
        assertTrue(found.isPresent());
        assertEquals("Persisted User", found.get().getFullName());
        assertEquals(AccountStatus.PENDING, found.get().getStatus());
        assertEquals(Role.USER, found.get().getRole());
    }

    @Test
    void existsByEmail_ReturnsCorrectBoolean() {
        User user = new User("check@example.com", "hash", "Check User", Role.USER, AccountStatus.ACTIVE);
        userRepository.save(user);

        assertTrue(userRepository.existsByEmail("check@example.com"));
        assertFalse(userRepository.existsByEmail("notfound@example.com"));
    }

    @Test
    void duplicateEmail_ThrowsDataIntegrityViolationException() {
        User user1 = new User("duplicate@example.com", "hash1", "User One", Role.USER, AccountStatus.PENDING);
        userRepository.saveAndFlush(user1);

        User user2 = new User("duplicate@example.com", "hash2", "User Two", Role.USER, AccountStatus.PENDING);
        assertThrows(DataIntegrityViolationException.class, () -> userRepository.saveAndFlush(user2));
    }

    @Test
    void findByStatusAndRole_Success() {
        User user1 = new User("u1@example.com", "h1", "User 1", Role.ADMIN, AccountStatus.ACTIVE);
        User user2 = new User("u2@example.com", "h2", "User 2", Role.USER, AccountStatus.PENDING);
        userRepository.save(user1);
        userRepository.save(user2);

        List<User> pendingUsers = userRepository.findByStatus(AccountStatus.PENDING);
        assertEquals(1, pendingUsers.size());
        assertEquals("u2@example.com", pendingUsers.get(0).getEmail());

        List<User> adminUsers = userRepository.findByRole(Role.ADMIN);
        assertEquals(1, adminUsers.size());
        assertEquals("u1@example.com", adminUsers.get(0).getEmail());
    }
}
