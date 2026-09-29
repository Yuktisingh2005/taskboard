import { Router } from "express";
import {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  getActivity,
  deleteBoard,
  addMember,
} from "../controllers/boardController";
import { createTask } from "../controllers/taskController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import {
  createBoardSchema,
  updateBoardSchema,
  addMemberSchema,
  createTaskSchema,
} from "../utils/schemas";

const router = Router();

router.use(authMiddleware);

router.post("/", validate(createBoardSchema), createBoard);
router.get("/", listBoards);
router.get("/:id", getBoard);
router.patch("/:id", validate(updateBoardSchema), updateBoard);
router.delete("/:id", deleteBoard);
router.get("/:id/activity", getActivity);
router.post("/:id/members", validate(addMemberSchema), addMember);
router.post("/:id/tasks", validate(createTaskSchema), createTask);

export default router;