package com.BloodDonorFinderApp.demo.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Set;

public class BloodGroupValidator implements ConstraintValidator<ValidBloodGroup, String> {

    private static final Set<String> VALID_BLOOD_GROUPS = Set.of(
            "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        return VALID_BLOOD_GROUPS.contains(value.trim().toUpperCase());
    }
}
