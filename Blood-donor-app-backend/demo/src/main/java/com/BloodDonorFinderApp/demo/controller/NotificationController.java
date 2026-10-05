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
        this.notificationService =
                notificationService;
    }


    // ==========================================
    // GET USER NOTIFICATIONS
    // ==========================================

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>>
    getUserNotifications(
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                notificationService
                        .getUserNotifications(userId)
        );
    }


    // ==========================================
    // GET UNREAD COUNT
    // ==========================================

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>>
    getUnreadCount(
            @PathVariable Long userId
    ) {

        long count =
                notificationService
                        .getUnreadCount(userId);

        return ResponseEntity.ok(
                Map.of(
                        "unreadCount",
                        count
                )
        );
    }


    // ==========================================
    // MARK ONE AS READ
    // ==========================================

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId
    ) {

        try {

            return ResponseEntity.ok(
                    notificationService
                            .markAsRead(
                                    notificationId
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

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(
            @PathVariable Long userId
    ) {

        notificationService
                .markAllAsRead(userId);

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
            @PathVariable Long notificationId
    ) {

        try {

            notificationService
                    .deleteNotification(
                            notificationId
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
    // CLEAR ALL
    // ==========================================

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> clearNotifications(
            @PathVariable Long userId
    ) {
//
        notificationService
                .clearNotifications(userId);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "All notifications cleared"
                )
        );
    }
}