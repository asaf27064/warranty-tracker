import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllProducts,
  getProductStats,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { idParamSchema } from "../schemas/common.schema";
import { validateRequest } from "../middlewares/validate";
import {
  getAllProductsQuerySchema,
  updateProductSchema,
  createProductSchema,
} from "../schemas/product.schema";

const router = Router();

router.use(verifyJWT);

router.get(
  "/",
  validateRequest(getAllProductsQuerySchema, "query"),
  getAllProducts,
);
router.get("/stats", getProductStats);
router.get("/:id", validateRequest(idParamSchema, "params"), getProductById);
router.post("/", validateRequest(createProductSchema, "body"), createProduct);
router.put(
  "/:id",
  validateRequest(idParamSchema, "params"),
  validateRequest(updateProductSchema, "body"),
  updateProduct,
);
router.delete("/:id", validateRequest(idParamSchema, "params"), deleteProduct);

export default router;
