import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Images, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryModalProps {
  images: string[];
  name: string;
}

const IMAGES_PER_PAGE = 5;

export const ImageGalleryModal = ({ images, name }: ImageGalleryModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
  const paginatedImages = images.slice((page - 1) * IMAGES_PER_PAGE, page * IMAGES_PER_PAGE);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay to avoid the trigger click closing it immediately
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  // Reset page when opening
  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  if (images.length <= 1) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 right-4 z-40 bg-white/95 backdrop-blur-sm text-slate-900 hover:bg-white border-none shadow-lg rounded-2xl px-5 py-3 font-black uppercase text-xs tracking-tight flex items-center gap-2"
      >
        <Images className="h-4 w-4" />
        See All ({images.length})
      </Button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/40" style={{ top: 0 }}>
          <div
            ref={panelRef}
            className="absolute left-1/2 -translate-x-1/2 bg-background rounded-b-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            style={{ top: '56px', maxHeight: 'calc(100vh - 56px)', width: 'min(95vw, 900px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
              <h2 className="text-sm font-black uppercase tracking-tight">
                {name} - Gallery ({images.length} photos)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="rounded-full text-xs font-bold flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>

            {/* Image grid */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {paginatedImages.map((img, idx) => (
                  <div
                    key={`${page}-${idx}`}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img}
                      alt={`${name} - Photo ${(page - 1) * IMAGES_PER_PAGE + idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-size image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={selectedImage}
            alt={name}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
