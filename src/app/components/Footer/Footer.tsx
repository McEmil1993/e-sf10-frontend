import type { FooterProps } from "@/app/types/components/footerTypes";

export default function Footer({ caption }: FooterProps) {
  return (
    <footer className="admin-footer border-t border-border bg-card px-4 py-3 text-sm text-muted sm:px-6 lg:px-8">
      <p>{caption}</p>
    </footer>
  );
}
