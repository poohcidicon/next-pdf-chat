/* eslint-disable @typescript-eslint/no-explicit-any */
import { UploadDropzone } from "@/lib/uploadthing";
import { Pencil, XCircle } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import {
  FaFilePdf,
  FaImage,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFilePowerpoint,
  FaFileAlt,
} from "react-icons/fa";
import { MdTextSnippet } from "react-icons/md"; // For .txt files

type PDFUploadInputProps = {
  label: string;
  file: FileProps | null;
  setFile: any;
  className?: string;
  endpoint?: any;
};
export type FileProps = {
  title: string;
  type: string;
  size: number;
  url: string;
};
export function getFileIcon(extension: string | undefined) {
  switch (extension) {
    case "pdf":
      return <FaFilePdf className="w-6 h-6 flex-shrink-0 mr-2 text-red-500" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <FaImage className="w-6 h-6 flex-shrink-0 mr-2 text-gray-600" />;
    case "doc":
    case "docx":
      return (
        <FaFileWord className="w-6 h-6 flex-shrink-0 mr-2 text-blue-500" />
      );
    case "xls":
    case "xlsx":
      return (
        <FaFileExcel className="w-6 h-6 flex-shrink-0 mr-2 text-green-500" />
      );
    case "ppt":
    case "pptx":
      return (
        <FaFilePowerpoint className="w-6 h-6 flex-shrink-0 mr-2 text-orange-500" />
      );
    case "zip":
    case "gzip":
    case "tar":
      return (
        <FaFileArchive className="w-6 h-6 flex-shrink-0 mr-2 text-yellow-600" />
      );
    case "txt":
      return (
        <MdTextSnippet className="w-6 h-6 flex-shrink-0 mr-2 text-gray-500" />
      );
    default:
      return <FaFileAlt className="w-6 h-6 flex-shrink-0 mr-2 text-gray-500" />; // Default icon for other file types
  }
}
export default function PDFFileUpload({
  label,
  file,
  setFile,
  className = "col-span-full",
  endpoint = "",
}: PDFUploadInputProps) {
  function handleImageRemove() {
    setFile(null);
  }
  const extension = file ? file.title.split(".").pop() : "pdf";
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <label
          htmlFor="course-image"
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-slate-50 mb-2"
        >
          {label}
        </label>
        {file && (
          <button
            onClick={() => setFile(null)}
            type="button"
            className="flex space-x-2 bg-slate-900 rounded-md shadow text-slate-50 py-2 px-4"
          >
            <Pencil className="w-5 h-5" />
            <span>Change Files</span>
          </button>
        )}
      </div>
      {file ? (
        <div className="grid grid-cols-1">
          <div className="relative mb-6">
            <button
              type="button"
              onClick={() => handleImageRemove()}
              className="absolute -top-4 -right-2 bg-slate-100 text-red-600 rounded-full "
            >
              <XCircle className="" />
            </button>
            <div className="py-2 rounded-md px-6 bg-white dark:bg-slate-800 text-slate-800 flex items-center dark:text-slate-200 border border-slate-200">
              {getFileIcon(extension)} {/* Render appropriate icon */}
              <div className="flex flex-col">
                <span className="line-clamp-1">{file.title}</span>
                {file.size > 0 && (
                  <span className="text-xs">
                    {(file.size / 1000).toFixed(2)} kb
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <UploadDropzone
          className="ut-allowed-content:hidden"
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            const item = res[0];
            const url = {
              url: item.url,
              title: item.name,
              size: item.size,
              type: item.type,
            };
            setFile(url);
            console.log(url);
            console.log(res);
            console.log("Upload Completed");
          }}
          onUploadError={(error) => {
            toast.error("File Upload Failed, Try Again");
            console.log(`ERROR! ${error.message}`, error);
          }}
        />
      )}
    </div>
  );
}