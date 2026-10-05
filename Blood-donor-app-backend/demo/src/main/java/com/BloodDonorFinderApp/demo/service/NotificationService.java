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
        this.notificationRepository =
                notificationRepository;

        this.userRepository =
                userRepository;
    }


    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

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
    // GET USER NOTIFICATIONS
    // ==========================================

    public List<Notification> getUserNotifications(
            Long userId
    ) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        userId
                );
    }


    // ==========================================
    // GET UNREAD COUNT
    // ==========================================

    public long getUnreadCount(
            Long userId
    ) {

        return notificationRepository
                .countByUserIdAndReadFalse(
                        userId
                );
    }


    // ==========================================
    // MARK ONE AS READ
    // ==========================================

    public Notification markAsRead(
            Long notificationId
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        notification.setRead(true);

        return notificationRepository.save(
                notification
        );
    }


    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    public void markAllAsRead(
            Long userId
    ) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdOrderByCreatedAtDesc(
                                userId
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
            Long notificationId
    ) {

        if (!notificationRepository
                .existsById(notificationId)) {

            throw new RuntimeException(
                    "Notification not found"
            );
        }

        notificationRepository.deleteById(
                notificationId
        );
    }


    // ==========================================
    // CLEAR ALL
    // ==========================================

    public void clearNotifications(
            Long userId
    ) {

        notificationRepository.deleteByUserId(
                userId
        );
    }
}