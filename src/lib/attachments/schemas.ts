import { z } from "zod";

import { UUID_RE } from "@/lib/utils/constants";

export const attachmentIdSchema = z.string().regex(UUID_RE, "Invalid attachment selected.");
export type AttachmentIdInput = z.infer<typeof attachmentIdSchema>;
