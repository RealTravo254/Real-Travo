import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  backgroundImage?: string;
}

export const PageHeader = ({ 
  title, 
  showBackButton = true, 
  showHomeButton = true,
  backgroundImage
}: PageHeaderProps) => {
  const navigate = useNavigate();

  if (backgroundImage) {
    return (
      <div 
        className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-white p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center">{title}</h1>
        </div>
        {showBackButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        {showHomeButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/")}
            className="absolute top-4 right-4 gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center justify-between mb-6 pb-4 border-b border-border">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      {showHomeButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      )}
    </div>
  );
};
