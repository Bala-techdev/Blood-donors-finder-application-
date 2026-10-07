package com.BloodDonorFinderApp.demo.controller;

import com.BloodDonorFinderApp.demo.entity.Notification;
import com.BloodDonorFinderApp.demo.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    // ==========================================
    // GET MY NOTIFICATIONS
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<List<Notification>> getMyNotifications(
            org.springframework.security.core.Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                notificationService.getUserNotificationsByEmail(email)
        );
    }

    // ==========================================
    // GET MY UNREAD COUNT
    // ==========================================

    @GetMapping("/me/unread-count")
    public ResponseEntity<Map<String, Long>> getMyUnreadCount(
            org.springframework.security.core.Authentication authentication
    ) {

        String email = authentication.getName();

        long count =
                notificationService.getUnreadCountByEmail(email);

        return ResponseEntity.ok(
                Map.of("unreadCount", count)
        );
    }

    // ==========================================
    // MARK ONE AS READ
    // ==========================================

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId,
            org.springframework.security.core.Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            return ResponseEntity.ok(
                    notificationService.markAsRead(
                            notificationId,
                            email
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }

    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    @PutMapping("/me/read-all")
    public ResponseEntity<?> markAllAsRead(
            org.springframework.security.core.Authentication authentication
    ) {

        String email = authentication.getName();

        notificationService.markAllAsReadByEmail(email);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "All notifications marked as read"
                )
        );
    }

    // ==========================================
    // DELETE ONE
    // ==========================================

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long notificationId,
            org.springframework.security.core.Authentication authentication
    ) {

        try {

            String email = authentication.getName();

            notificationService.deleteNotification(
                    notificationId,
                    email
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Notification deleted"
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }

    // ==========================================
    // CLEAR MY NOTIFICATIONS
    // ==========================================

    @DeleteMapping("/me")
    public ResponseEntity<?> clearNotifications(
            org.springframework.security.core.Authentication authentication
    ) {

        String email = authentication.getName();

        notificationService.clearNotificationsByEmail(email);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "All notifications cleared"
                )
        );
    }
}