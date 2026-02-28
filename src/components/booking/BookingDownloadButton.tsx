import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { BookingPDFData, generateQRCodeData, downloadBookingAsPDF } from "@/lib/pdfBookingExport";
import { toast } from "sonner";

interface BookingDownloadButtonProps {
  booking: BookingPDFData;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const BookingDownloadButton = ({ 
  booking, 
  variant = "outline", 
  size = "sm",
  className 
}: BookingDownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const qrData = generateQRCodeData(booking);

  const getQRDataUrl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // First try: use the already-rendered hidden canvas
      const existingCanvas = qrRef.current;
      if (existingCanvas) {
        try {
          const dataUrl = existingCanvas.toDataURL("image/png");
          // toDataURL returns "data:," if canvas is empty/tainted — check for valid data
          if (dataUrl && dataUrl.length > 100 && dataUrl !== "data:,") {
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          // Canvas may be tainted on some Android WebViews — fall through to fresh render
          console.warn("Existing canvas toDataURL failed, re-rendering:", e);
        }
      }

      // Fallback: create a fresh offscreen container and render QR code into it.
      // This handles cases where the hidden div canvas hasn't painted yet on mobile
      // (e.g. inside a collapsed section, or iOS Safari lazy canvas painting).
      try {
        const container = document.createElement("div");
        container.style.cssText = [
          "position:fixed",
          "top:-9999px",
          "left:-9999px",
          "width:256px",
          "height:256px",
          "opacity:0",
          "pointer-events:none",
        ].join(";");
        document.body.appendChild(container);

        // Dynamically render a fresh QRCodeCanvas into the temp container
        import("react-dom/client").then(({ createRoot }) => {
          import("react").then((React) => {
            const root = createRoot(container);
            root.render(
              React.createElement(QRCodeCanvas, {
                value: qrData,
                size: 256,
                level: "H",
                includeMargin: true,
              })
            );

            // Give React one animation frame + small timeout to paint the canvas
            requestAnimationFrame(() => {
              setTimeout(() => {
                try {
                  const tempCanvas = container.querySelector("canvas");
                  if (tempCanvas) {
                    const dataUrl = tempCanvas.toDataURL("image/png");
                    if (dataUrl && dataUrl.length > 100 && dataUrl !== "data:,") {
                      resolve(dataUrl);
                    } else {
                      reject(new Error("Temp canvas produced empty data URL"));
                    }
                  } else {
                    reject(new Error("No canvas found in temp container"));
                  }
                } catch (err) {
                  reject(err);
                } finally {
                  root.unmount();
                  if (document.body.contains(container)) {
                    document.body.removeChild(container);
                  }
                }
              }, 150); // 150ms is enough for a single QR canvas render
            });
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const qrCodeDataUrl = await getQRDataUrl();
      await downloadBookingAsPDF(booking, qrCodeDataUrl);
      toast.success("Booking downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download booking. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/*
        FIX: The hidden QR canvas MUST NOT use display:none or visibility:hidden.
        Both of those prevent the canvas from painting on iOS Safari and some Android WebViews.
        
        Safe approach: use fixed positioning off-screen + opacity:0.
        The canvas is technically "visible" to the browser so it paints,
        but the user never sees it.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: 256,
          height: 256,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <QRCodeCanvas
          ref={qrRef}
          value={qrData}
          size={256}
          level="H"
          includeMargin
        />
      </div>

      <Button
        variant={variant}
        size={size}
        /*
          FIX: onPointerDown stopPropagation prevents the parent collapsible card
          from toggling when this button is tapped on mobile. Must be on BOTH
          onPointerDown (fires first, stops Radix pointer capture) and onClick.
        */
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        disabled={isDownloading}
        className={className}
        /*
          FIX: touch-action:manipulation removes the 300ms tap delay on mobile browsers.
          Without this, buttons inside scrollable areas feel unresponsive.
        */
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Booking
          </>
        )}
      </Button>
    </>
  );
};