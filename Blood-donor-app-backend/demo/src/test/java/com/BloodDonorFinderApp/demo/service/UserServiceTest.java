package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("createUser normalises email with spaces and uppercase before saving")
    void createUser_normalisesEmail_beforeSaving() {
        User user = new User();
        user.setName("Alice");
        user.setEmail("   ALICE@EXAMPLE.COM   ");
        user.setPassword("secret123");
        user.setPhone("1234567890");

        when(userRepository.existsByEmailIgnoreCase("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded_secret");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User created = userService.createUser(user);

        assertNotNull(created);
        assertEquals("alice@example.com", created.getEmail(), "Email must be trimmed and lower-cased");
        verify(userRepository).existsByEmailIgnoreCase("alice@example.com");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("createUser rejects email that is already registered under different casing")
    void createUser_rejectsDuplicateEmail_regardlessOfCasing() {
        User user = new User();
        user.setName("Bob");
        user.setEmail("Bob@Example.com");
        user.setPassword("secret123");

        when(userRepository.existsByEmailIgnoreCase("bob@example.com")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.createUser(user));
        assertEquals("Email already registered", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("getUserByEmail queries repository case-insensitively")
    void getUserByEmail_normalisesInput() {
        User user = new User("Charlie", "charlie@example.com", "pass", "123", "USER");
        when(userRepository.findByEmailIgnoreCase("charlie@example.com")).thenReturn(Optional.of(user));

        Optional<User> found = userService.getUserByEmail("  CHARLIE@EXAMPLE.COM  ");

        assertTrue(found.isPresent());
        assertEquals("charlie@example.com", found.get().getEmail());
        verify(userRepository).findByEmailIgnoreCase("charlie@example.com");
    }
}
