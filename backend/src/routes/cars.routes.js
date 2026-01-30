import { auth } from "../middlewares/auth.js";

router.post("/", auth, async (req, res, next) => { ... });
router.put("/:id", auth, async (req, res, next) => { ... });
router.delete("/:id", auth, async (req, res, next) => { ... });
