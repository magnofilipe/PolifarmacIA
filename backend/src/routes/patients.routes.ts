import { Router } from "express";
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  addMedication,
  removeMedication,
} from "../controllers/patients.controller.js";

const router = Router();

router.get("/", listPatients);
router.post("/", createPatient);
router.get("/:id", getPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

// Medicamentos do paciente
router.post("/:id/medications", addMedication);
router.delete("/:id/medications/:medId", removeMedication);

export default router;
