  
  import { describe, it, expect, beforeEach } from "vitest";
  import mongoose from "mongoose";
  import { Task } from "../models/Task";
  import { applyTaskUpdate } from "../services/taskService";
  import { AppError } from "../utils/AppError";

  
  const boardId = new mongoose.Types.ObjectId();
  const userA = new mongoose.Types.ObjectId().toString();
  const userB = new mongoose.Types.ObjectId().toString();

  async function createTask(overrides = {}) {
    return Task.create({
      boardId,
      title: "Original title",
      description: "Original description",
      status: "todo",
      position: 1000,
      createdBy: userA,
      ...overrides,
    });
  }

  describe("applyTaskUpdate – concurrency (the assignment's engineering problem)", () => {
    it("accepts an update when baseVersion matches the current version", async () => {
      const task = await createTask();
      expect(task.version).toBe(0);

      const { task: updated, changedFields } = await applyTaskUpdate(
        task.id,
        { title: "New title" },
        0 
      );

      expect(updated.title).toBe("New title");
      expect(updated.version).toBe(1);
      expect(changedFields).toContain("title");
    });

    it("merges when User A edits title and User B edits description on the same base version", async () => {
      const task = await createTask();

      
      await applyTaskUpdate(task.id, { title: "A changed title" }, 0);

      
      const { task: merged, changedFields } = await applyTaskUpdate(
        task.id,
        { description: "B changed description" },
        0 
      );

      expect(merged.title).toBe("A changed title"); 
      expect(merged.description).toBe("B changed description"); 
      expect(merged.version).toBe(2);
      expect(changedFields).toContain("description");
    });

    it("rejects with 409 when two users edit the SAME field", async () => {
      const task = await createTask();

      
      await applyTaskUpdate(task.id, { title: "A's title" }, 0);

      
      await expect(
        applyTaskUpdate(task.id, { title: "B's title" }, 0)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("changed by someone else"),
      });
    });

    it("does nothing and returns empty changedFields when value is identical", async () => {
      const task = await createTask();

      const { changedFields } = await applyTaskUpdate(
        task.id,
        { title: "Original title" }, 
        0
      );

      expect(changedFields).toHaveLength(0);
    });

    it("increments version once per update", async () => {
      const task = await createTask();
      expect(task.version).toBe(0);

      await applyTaskUpdate(task.id, { title: "v1" }, 0);
      await applyTaskUpdate(task.id, { title: "v2" }, 1);
      await applyTaskUpdate(task.id, { title: "v3" }, 2);

      const final = await Task.findById(task.id);
      expect(final?.version).toBe(3);
    });

    it("rejects when baseVersion is newer than server version", async () => {
      const task = await createTask();

      await expect(
        applyTaskUpdate(task.id, { title: "Future edit" }, 99)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });