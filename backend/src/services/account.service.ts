import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../config/r2";
import prisma from "../config/db";

// Delete every object under a key prefix (R2 has no single "delete by prefix",
// so we list then batch-delete in pages of up to 1000).
async function deletePrefix(prefix: string) {
  let token: string | undefined;
  do {
    const list = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    const objects = list.Contents ?? [];
    if (objects.length > 0) {
      await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
        }),
      );
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);
}

// Wipe the user: their R2 files first (best-effort, per user-scoped prefix),
// then the DB row. Cascades handle products, documents, reminders,
// conversations, messages, refresh tokens and push subscriptions.
export async function deleteUserData(userId: string) {
  await Promise.allSettled([
    deletePrefix(`documents/${userId}/`),
    deletePrefix(`products/${userId}/`),
  ]);
  await prisma.user.delete({ where: { id: userId } });
}
