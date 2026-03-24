import type { APIRoute } from "astro";
import { createPwaIconResponse } from "../lib/pwaIcon";

export const GET: APIRoute = () => createPwaIconResponse(512);
