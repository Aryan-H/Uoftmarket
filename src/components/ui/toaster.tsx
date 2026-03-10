
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="top-center"
      theme={theme as "light" | "dark" | "system"}
      richColors
      closeButton
      toastOptions={{
        className: "glass-card border border-border",
        classNames: {
          title: "font-medium text-toronto-dark",
          description: "text-gray-600",
          actionButton: "bg-toronto-blue text-white",
          cancelButton: "bg-gray-200 text-gray-800",
          success: "!bg-green-50 !border-green-200",
          error: "!bg-red-50 !border-red-200",
          info: "!bg-blue-50 !border-blue-200"
        },
        duration: 4000,
      }}
    />
  );
}
