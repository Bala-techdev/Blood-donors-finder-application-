package com.BloodDonorFinderApp.demo.service;

import com.BloodDonorFinderApp.demo.entity.Notification;
import com.BloodDonorFinderApp.demo.entity.User;
import com.BloodDonorFinderApp.demo.repository.NotificationRepository;
import com.BloodDonorFinderApp.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

    /*
     * This method is used internally by the application
     * to create notifications for a specific user.
     *
     * We KEEP userId here because the application itself
     * needs to decide which user should receive a notification.
     */

    public Notification createNotification(
            Long userId,
            String type,
            String title,
            String message,
            Long requestId
    ) {

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        Notification notification =
                new Notification();

        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRequestId(requestId);
        notification.setRead(false);

        return notificationRepository.save(
                notification
        );
    }

    // ==========================================
    // GET MY NOTIFICATIONS
    // ==========================================

    public List<Notification> getUserNotificationsByEmail(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        user.getId()
                );
    }

    // ==========================================
    // GET MY UNREAD COUNT
    // ==========================================

    public long getUnreadCountByEmail(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        return notificationRepository
                .countByUserIdAndReadFalse(
                        user.getId()
                );
    }

    // ==========================================
    // MARK ONE AS READ
    // ==========================================

    public Notification markAsRead(
            Long notificationId,
            String email
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        // Verify ownership
        if (!notification.getUser()
                .getEmail()
                .equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to modify this notification"
            );
        }

        notification.setRead(true);

        return notificationRepository.save(
                notification
        );
    }

    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    public void markAllAsReadByEmail(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdOrderByCreatedAtDesc(
                                user.getId()
                        );

        for (Notification notification :
                notifications) {

            notification.setRead(true);
        }

        notificationRepository.saveAll(
                notifications
        );
    }

    // ==========================================
    // DELETE ONE
    // ==========================================

    public void deleteNotification(
            Long notificationId,
            String email
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        // Verify ownership
        if (!notification.getUser()
                .getEmail()
                .equals(email)) {

            throw new RuntimeException(
                    "You are not allowed to delete this notification"
            );
        }

        notificationRepository.delete(
                notification
        );
    }

    // ==========================================
    // CLEAR MY NOTIFICATIONS
    // ==========================================

    public void clearNotificationsByEmail(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        notificationRepository.deleteByUserId(
                user.getId()
        );
    }
}