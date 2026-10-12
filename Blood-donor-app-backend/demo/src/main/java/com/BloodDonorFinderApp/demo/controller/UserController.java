package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ==========================================
    // REGISTER USER
    // ==========================================

    @PostMapping
    public ResponseEntity<User> createUser(
            @RequestBody User user
    ) {
        User createdUser = userService.createUser(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdUser);
    }

    // ==========================================
    // GET CURRENT USER
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            Authentication authentication
    ) {
        String email = authentication.getName();

        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // ==========================================
    // UPDATE CURRENT USER
    // ==========================================

    @PutMapping("/me")
    public ResponseEntity<User> updateCurrentUser(
            @RequestBody User updatedUser,
            Authentication authentication
    ) {
        String email = authentication.getName();

        User updated = userService.updateUserByEmail(
                email,
                updatedUser
        );

        return ResponseEntity.ok(updated);
    }
}