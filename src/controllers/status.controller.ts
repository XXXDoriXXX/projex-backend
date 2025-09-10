import { Request, Response } from "express";
import * as statusService from "../services/status.service.js";

export const getServerStatus = async (req: Request, res: Response) => {
	const status = await statusService.getServerStatusInfo();
	res.status(200).json(status);
};
