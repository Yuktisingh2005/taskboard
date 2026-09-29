import { Router } from "express";
import { updateTask, deleteTask } from "../controllers/taskController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { updateTaskSchema } from "../utils/schemas";

const router = Router();

router.use(authMiddleware);

router.patch("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

export default router;