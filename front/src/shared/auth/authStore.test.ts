import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to mock the api module BEFORE importing authStore
vi.mock("../api/apiClient", () => ({
    api: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
    },
}));

import { authStore } from "./authStore";
import { api } from "../api/apiClient";

const mockApi = vi.mocked(api);

const fakeLoginResponse = {
    id: 1,
    tenantId: 10,
    tenantName: "TestCorp",
    fullName: "Juan Pérez",
    email: "juan@test.com",
    phone: "1234567890",
    token: "fake-jwt-token",
    refreshToken: "fake-refresh-token",
    roles: ["Admin", "Manager"],
};

describe("AuthStore", () => {
    beforeEach(() => {
        localStorage.clear();
        authStore.logout();
        vi.clearAllMocks();
    });

    // ── isAuthenticated ──
    describe("isAuthenticated", () => {
        it("should return false when no user and no token", () => {
            expect(authStore.isAuthenticated).toBe(false);
        });

        it("should return true after successful login", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "password123");
            expect(authStore.isAuthenticated).toBe(true);
        });

        it("should return false after logout", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "password123");
            authStore.logout();
            expect(authStore.isAuthenticated).toBe(false);
        });
    });

    // ── login ──
    describe("login", () => {
        it("should return true and set user on success", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            const result = await authStore.login("juan@test.com", "password123");

            expect(result).toBe(true);
            expect(authStore.user).toEqual({
                id: 1,
                tenantId: 10,
                tenantName: "TestCorp",
                fullName: "Juan Pérez",
                email: "juan@test.com",
                phone: "1234567890",
                roles: ["Admin", "Manager"],
            });
        });

        it("should store token in localStorage", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "password123");

            expect(localStorage.getItem("auth_token")).toBe("fake-jwt-token");
            expect(localStorage.getItem("refresh_token")).toBe("fake-refresh-token");
        });

        it("should return false on API error", async () => {
            mockApi.post.mockRejectedValueOnce(new Error("401"));
            const result = await authStore.login("bad@test.com", "wrong");

            expect(result).toBe(false);
            expect(authStore.user).toBeNull();
        });

        it("should call correct API endpoint", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "pass");

            expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
                email: "juan@test.com",
                password: "pass",
            });
        });
    });

    // ── logout ──
    describe("logout", () => {
        it("should clear user and all tokens", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "password123");

            authStore.logout();

            expect(authStore.user).toBeNull();
            expect(localStorage.getItem("auth_token")).toBeNull();
            expect(localStorage.getItem("auth_user")).toBeNull();
            expect(localStorage.getItem("refresh_token")).toBeNull();
        });
    });

    // ── hasRole / hasAnyRole ──
    describe("role checks", () => {
        beforeEach(async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "password123");
        });

        it("hasRole returns true for existing role", () => {
            expect(authStore.hasRole("Admin")).toBe(true);
            expect(authStore.hasRole("Manager")).toBe(true);
        });

        it("hasRole returns false for non-existing role", () => {
            expect(authStore.hasRole("User")).toBe(false);
            expect(authStore.hasRole("SuperAdmin")).toBe(false);
        });

        it("hasAnyRole returns true if any role matches", () => {
            expect(authStore.hasAnyRole("User", "Admin")).toBe(true);
        });

        it("hasAnyRole returns false if no role matches", () => {
            expect(authStore.hasAnyRole("User", "Guest")).toBe(false);
        });
    });

    // ── token ──
    describe("token", () => {
        it("should return null when not logged in", () => {
            expect(authStore.token).toBeNull();
        });

        it("should return JWT after login", async () => {
            mockApi.post.mockResolvedValueOnce(fakeLoginResponse);
            await authStore.login("juan@test.com", "password123");
            expect(authStore.token).toBe("fake-jwt-token");
        });
    });

    // ── changePassword ──
    describe("changePassword", () => {
        it("should return true on success", async () => {
            mockApi.put.mockResolvedValueOnce(undefined);
            const result = await authStore.changePassword("oldPass", "newPass");
            expect(result).toBe(true);
            expect(mockApi.put).toHaveBeenCalledWith("/auth/change-password", {
                currentPassword: "oldPass",
                newPassword: "newPass",
            });
        });

        it("should return false on API error", async () => {
            mockApi.put.mockRejectedValueOnce(new Error("400"));
            const result = await authStore.changePassword("old", "new");
            expect(result).toBe(false);
        });
    });
});
