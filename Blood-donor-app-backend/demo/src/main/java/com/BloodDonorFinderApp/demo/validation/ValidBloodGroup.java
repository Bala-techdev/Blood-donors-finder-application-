package com.BloodDonorFinderApp.demo.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = BloodGroupValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidBloodGroup {
    String message() default "Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
