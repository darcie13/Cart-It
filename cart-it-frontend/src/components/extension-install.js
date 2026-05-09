import React from "react";
import { LuDownload, LuArrowRight, LuCircleCheckBig } from "react-icons/lu";

const ExtensionInstall = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Install Cart-It Extension
          </h1>
          <p className="text-gray-500 mt-2">
            Get the full experience by connecting your browser extension
          </p>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-10">
          <a
            href="/extension.zip"
            download
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-md transition"
          >
            <LuDownload />
            Download Extension (.zip)
          </a>
        </div>

        {/* Steps */}
        <div className="space-y-6">

          {/* Step 1 */}
          <div className="flex gap-4 items-start">
            <LuCircleCheckBig className="text-green-500 mt-1" size={22} />
            <div>
              <h3 className="font-semibold text-gray-800">
                Step 1: Unzip the file
              </h3>
              <p className="text-sm text-gray-500">
                Extract the downloaded extension folder to your desktop.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center text-gray-300">
            <LuArrowRight />
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start">
            <LuCircleCheckBig className="text-green-500 mt-1" size={22} />
            <div>
              <h3 className="font-semibold text-gray-800">
                Step 2: Open Chrome Extensions
              </h3>
              <p className="text-sm text-gray-500">
                Go to <span className="font-mono bg-gray-100 px-2 py-1 rounded">chrome://extensions</span>
              </p>
            </div>
          </div>

          <div className="flex justify-center text-gray-300">
            <LuArrowRight />
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start">
            <LuCircleCheckBig className="text-green-500 mt-1" size={22} />
            <div>
              <h3 className="font-semibold text-gray-800">
                Step 3: Enable Developer Mode
              </h3>
              <p className="text-sm text-gray-500">
                Toggle “Developer Mode” in the top-right corner.
              </p>
            </div>
          </div>

          <div className="flex justify-center text-gray-300">
            <LuArrowRight />
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 items-start">
            <LuCircleCheckBig className="text-green-500 mt-1" size={22} />
            <div>
              <h3 className="font-semibold text-gray-800">
                Step 4: Load the Extension
              </h3>
              <p className="text-sm text-gray-500">
                Click “Load unpacked” and select the extracted folder.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-10 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
          💡 This is a developer installation method used during testing.
          The Chrome Web Store version is intended for future deployment.
        </div>

      </div>
    </div>
  );
};

export default ExtensionInstall;