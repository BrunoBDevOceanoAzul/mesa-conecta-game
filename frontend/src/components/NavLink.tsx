import { forwardRef } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  to: string;
  href?: string;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, href, ...props }, ref) => {
    const router = useRouter();
    const path = to || href || "";
    const isActive = router.pathname === path;

    return (
      <NextLink
        ref={ref}
        href={path}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
