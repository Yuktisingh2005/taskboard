  // backend/src/tests/tasks.test.ts
  import { describe, it, expect, beforeEach } from "vitest";
  import request from "supertest";
  import app from "../app";

  async function registerAndLogin(email: string) {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });
    return { token: res.body.token as string, userId: res.body.user._id as string };
  }

  async function createBoard(token: string, name = "Test Board") {
    const res = await request(app)
      .post("/api/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name });
    return res.body._id as string;
  }

  describe("Tasks API", () => {
    let token: string;
    let boardId: string;

    beforeEach(async () => {
      ({ token } = await registerAndLogin("tasks@test.com"));
      boardId = await createBoard(token);
    });

    it("creates a task in the todo column", async () => {
      const res = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Fix bug", description: "Details here", status: "todo" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Fix bug");
      expect(res.body.status).toBe("todo");
      expect(res.body.version).toBe(0);
    });

    it("updates a task title", async () => {
      const create = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Original", status: "todo" });

      const taskId = create.body._id;

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated", baseVersion: 0 });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated");
      expect(res.body.version).toBe(1);
    });

    it("moves a task to another column", async () => {
      const create = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Move me", status: "todo" });

      const taskId = create.body._id;

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "in_progress", baseVersion: 0 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("in_progress");
    });

    it("returns 409 on same-field conflict", async () => {
      const create = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Conflict task", status: "todo" });

      const taskId = create.body._id;

      // First update succeeds — version goes to 1
      await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "First edit", baseVersion: 0 });

      // Second update on same field with stale baseVersion — must 409
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Conflicting edit", baseVersion: 0 });

      expect(res.status).toBe(409);
    });

    it("deletes a task", async () => {
      const create = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Delete me", status: "todo" });

      const taskId = create.body._id;

      const delRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(delRes.status).toBe(204);
    });

    it("viewer cannot create a task", async () => {
      // Invite a viewer
      const { token: viewerToken } = await registerAndLogin("viewer@test.com");
      await request(app)
        .post(`/api/boards/${boardId}/members`)
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "viewer@test.com", role: "viewer" });

      const res = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ title: "Viewer task", status: "todo" });

      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid board id", async () => {
      const res = await request(app)
        .get("/api/boards/not-a-valid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });