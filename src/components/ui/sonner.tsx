
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      richColors
      closeButton
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "group glass-card border-border",
          title: "text-foreground font-semibold",
          description: "text-foreground/80",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "!bg-green-50 !border-green-200 !text-green-800",
          error: "!bg-red-50 !border-red-200 !text-red-800",
          info: "!bg-blue-50 !border-blue-200 !text-blue-800"
        },
        duration: 4000,
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
