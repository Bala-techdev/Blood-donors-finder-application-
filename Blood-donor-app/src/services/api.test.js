import test from "node:test";
import assert from "node:assert/strict";
import { isInternalApiUrl } from "./api.js";

test("isInternalApiUrl allows relative paths", () => {
    assert.equal(isInternalApiUrl("/api/donors/search"), true);
    assert.equal(isInternalApiUrl("/api/auth/login"), true);
});

test("isInternalApiUrl allows same-host endpoints", () => {
    assert.equal(isInternalApiUrl("http://localhost:8080/api/requests", "http://localhost:8080"), true);
});

test("isInternalApiUrl blocks external third-party hosts", () => {
    assert.equal(isInternalApiUrl("https://nominatim.openstreetmap.org/search", "http://localhost:8080"), false);
    assert.equal(isInternalApiUrl("https://evil-hacker.com/steal-token", "http://localhost:8080"), false);
    assert.equal(isInternalApiUrl("https://maps.googleapis.com/maps/api/geocode", "http://localhost:8080"), false);
});

test("frontend email normalization trims whitespace and lowers case", () => {
    const rawInputs = [
        "   User@Example.COM   ",
        "john.doe@GMAIL.COM",
        "  TEST@test.org "
    ];
    const expected = [
        "user@example.com",
        "john.doe@gmail.com",
        "test@test.org"
    ];

    rawInputs.forEach((input, idx) => {
        const normalised = input.trim().toLowerCase();
        assert.equal(normalised, expected[idx]);
    });
});
