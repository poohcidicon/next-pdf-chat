import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  pdfUpload: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    console.log("file url", file.url);
    return { uploadedBy: "Komsak" };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;