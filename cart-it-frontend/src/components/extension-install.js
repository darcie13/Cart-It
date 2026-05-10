import React from "react";
import {
  LuDownload,
  LuArrowRight,
  LuCircleCheckBig,
  LuChrome,
  LuShieldCheck,
  LuSparkles
} from "react-icons/lu";

const ExtensionInstall = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 px-6 py-16">

      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200 opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 opacity-20 blur-3xl rounded-full"></div>

      <div className="relative max-w-3xl mx-auto">

        {/* Top Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-white border border-orange-100 shadow-sm px-4 py-2 rounded-full text-sm text-gray-700">
            <LuChrome className="text-orange-500" />
            Chrome Extension Installation
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur shadow-2xl rounded-[2rem] border border-gray-100 overflow-hidden">

          {/* Hero Section */}
          <div className="px-10 pt-12 pb-10 text-center border-b border-gray-100">

            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                <LuSparkles className="text-white" size={36} />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
              Install the Cart-It Extension
            </h1>

            <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
              Save products instantly, track price drops, and organize your shopping experience directly from your browser.
            </p>

            {/* Download Button */}
            <div className="mt-8">
              <a
                href="/cart-it-extension.zip"
                download
                className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 font-medium text-lg"
              >
                <LuDownload size={20} />
                Download Extension
              </a>

              <p className="text-xs text-gray-400 mt-3">
                Compatible with Google Chrome
              </p>
            </div>
          </div>

          {/* Steps Section */}
          <div className="px-10 py-10">

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <LuShieldCheck className="text-orange-500" size={20} />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Installation Guide
                </h2>
                <p className="text-sm text-gray-500">
                  Takes less than 1 minute to set up
                </p>
              </div>
            </div>

            <div className="space-y-8">

              {/* Step 1 */}
              <div className="flex gap-5 items-start">
                <div className="min-w-[42px] h-[42px] rounded-xl bg-green-100 flex items-center justify-center">
                  <LuCircleCheckBig className="text-green-600" size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Step 1 — Download & Unzip
                  </h3>

                  <p className="text-gray-500 mt-1 leading-relaxed">
                    Download the extension ZIP file and extract it to a convenient location like your Desktop.
                  </p>
                </div>
              </div>

              <div className="flex justify-center text-gray-300">
                <LuArrowRight size={20} />
              </div>

              {/* Step 2 */}
              <div className="flex gap-5 items-start">
                <div className="min-w-[42px] h-[42px] rounded-xl bg-green-100 flex items-center justify-center">
                  <LuCircleCheckBig className="text-green-600" size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Step 2 — Open Chrome Extensions
                  </h3>

                  <p className="text-gray-500 mt-1 leading-relaxed">
                    Open Chrome and navigate to:
                  </p>

                  <div className="mt-3 inline-block font-mono text-sm bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg text-gray-700">
                    chrome://extensions
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-gray-300">
                <LuArrowRight size={20} />
              </div>

              {/* Step 3 */}
              <div className="flex gap-5 items-start">
                <div className="min-w-[42px] h-[42px] rounded-xl bg-green-100 flex items-center justify-center">
                  <LuCircleCheckBig className="text-green-600" size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Step 3 — Enable Developer Mode
                  </h3>

                  <p className="text-gray-500 mt-1 leading-relaxed">
                    Toggle the <span className="font-medium text-gray-700">Developer Mode</span> switch in the top-right corner of the Extensions page.
                  </p>
                </div>
              </div>

              <div className="flex justify-center text-gray-300">
                <LuArrowRight size={20} />
              </div>

              {/* Step 4 */}
              <div className="flex gap-5 items-start">
                <div className="min-w-[42px] h-[42px] rounded-xl bg-green-100 flex items-center justify-center">
                  <LuCircleCheckBig className="text-green-600" size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Step 4 — Load the Extension
                  </h3>

                  <p className="text-gray-500 mt-1 leading-relaxed">
                    Click <span className="font-medium text-gray-700">“Load unpacked”</span> and select the extracted Cart-It extension folder.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-10 py-6">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="text-lg">💡</div>

              <p className="leading-relaxed">
                This installation method is commonly used during extension development and testing.
                Chrome Web Store deployment is planned for future production release.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Branding */}
        <div className="text-center mt-8 text-sm text-gray-400">
          Cart-It • Smart Shopping Management Platform
        </div>

      </div>
    </div>
  );
};

export default ExtensionInstall;