import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../config/r2";
import prisma from "../config/db";

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

export async function deleteUserData(userId: string) {
  await Promise.allSettled([
    deletePrefix(`documents/${userId}/`),
    deletePrefix(`products/${userId}/`),
  ]);
  await prisma.user.delete({ where: { id: userId } });
}
