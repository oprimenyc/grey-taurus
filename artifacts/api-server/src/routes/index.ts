import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import grantsRouter from "./grants.js";
import subcontractsRouter from "./subcontracts.js";
import redditRouter from "./reddit.js";
import qaFlagsRouter from "./qaFlags.js";
import emailRouter from "./emailRoute.js";
import scanRouter from "./scan.js";
import authRouter from "./authRoute.js";
import opportunitiesRouter from "./opportunities.js";
import pipelineRouter from "./pipeline.js";
import proposalsRouter from "./proposals.js";
import outreachRouter from "./outreach.js";
import agentsRouter from "./agents.js";
import settingsRouter from "./settingsRoute.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(grantsRouter);
router.use(subcontractsRouter);
router.use(redditRouter);
router.use(qaFlagsRouter);
router.use(emailRouter);
router.use(scanRouter);
router.use(authRouter);
router.use(opportunitiesRouter);
router.use(pipelineRouter);
router.use(proposalsRouter);
router.use(outreachRouter);
router.use(agentsRouter);
router.use(settingsRouter);

export default router;
