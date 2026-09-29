 // backend/src/tests/boards.test.ts
  import { describe, it, expect, beforeEach } from "vitest";
  import request from "supertest";
  import app from "../app";

  // Helper — registers a user and returns their auth token
  async function registerAndLogin(email: string) {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });
    return res.body.token as string;
  }

  describe("Boards API", () => {
    let token: string;

    beforeEach(async () => {
      token = await registerAndLogin("boards@test.com");
    });

    it("creates a board", async () => {
      const res = await request(app)
        .post("/api/boards")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "My Board" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("My Board");
      expect(res.body.members).toHaveLength(1);
      expect(res.body.members[0].role).toBe("owner");
    });

    it("lists only boards the user belongs to", async () => {
      const otherToken = await registerAndLogin("other@test.com");

      // Create one board as the main user and one as another user
      await request(app)
        .post("/api/boards")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "My Board" });

      await request(app)
        .post("/api/boards")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Other Board" });

      const res = await request(app)
        .get("/api/boards")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("My Board");
    });

    it("returns 403 when accessing someone else's board", async () => {
      const otherToken = await registerAndLogin("stranger@test.com");

      const createRes = await request(app)
        .post("/api/boards")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Private Board" });

      const boardId = createRes.body._id;

      const res = await request(app)
        .get(`/api/boards/${boardId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("renames a board (owner only)", async () => {
      const createRes = await request(app)
        .post("/api/boards")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Old Name" });

      const boardId = createRes.body._id;

      const res = await request(app)
        .patch(`/api/boards/${boardId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New Name");
    });

    it("deletes a board and its tasks", async () => {
      const createRes = await request(app)
        .post("/api/boards")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "To Delete" });

      const boardId = createRes.body._id;

      // Add a task
      await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Task", status: "todo" });

      const delRes = await request(app)
        .delete(`/api/boards/${boardId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(delRes.status).toBe(204);

      // Board is gone
      const getRes = await request(app)
        .get(`/api/boards/${boardId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(getRes.status).toBe(404);
    });

    it("returns 401 for unauthenticated requests", async () => {
      const res = await request(app).get("/api/boards");
      expect(res.status).toBe(401);
    });
  });