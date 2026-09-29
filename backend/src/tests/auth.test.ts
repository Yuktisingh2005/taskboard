  import { describe, it, expect } from "vitest";
  import request from "supertest";
  import app from "../app";

  describe("POST /api/auth/register", () => {
    it("creates a user and returns a token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Yukti",
        email: "yukti@test.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("yukti@test.com");
      expect(res.body.user).not.toHaveProperty("passwordHash");
    });

    it("rejects duplicate email with 409", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Yukti",
        email: "duplicate@test.com",
        password: "password123",
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Yukti",
        email: "duplicate@test.com",
        password: "password123",
      });

      expect(res.status).toBe(409);
    });

    it("rejects missing fields with 400", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "no-name@test.com",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns a token for correct credentials", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Yukti",
        email: "login@test.com",
        password: "password123",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "login@test.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("rejects wrong password with 401", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Yukti",
        email: "wrong@test.com",
        password: "correctpass",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "wrong@test.com",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
    });
  });