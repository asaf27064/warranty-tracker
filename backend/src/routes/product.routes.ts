import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllProducts,
  getProductStats,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProducts,
  bulkDeleteProducts,
  setProductsArchived,
} from "../controllers/product.controller";
import { idParamSchema } from "../schemas/common.schema";
import { validateRequest } from "../middlewares/validate";
import {
  getAllProductsQuerySchema,
  updateProductSchema,
  createProductSchema,
  bulkDeleteSchema,
  archiveSchema,
} from "../schemas/product.schema";

const router = Router();

router.use(verifyJWT);

router.get(
  "/",
  validateRequest(getAllProductsQuerySchema, "query"),
  getAllProducts,
);
router.get("/stats", getProductStats);
router.get(
  "/export",
  validateRequest(getAllProductsQuerySchema, "query"),
  exportProducts,
);
router.post(
  "/bulk-delete",
  validateRequest(bulkDeleteSchema, "body"),
  bulkDeleteProducts,
);
router.post(
  "/archive",
  validateRequest(archiveSchema, "body"),
  setProductsArchived,
);
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
