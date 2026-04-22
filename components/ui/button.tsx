import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

export function Button({
  className = "",
  variant = "default",
  ...props
}: ButtonProps) {
  const variantClass = variant === "ghost" ? "button-ghost" : "";

  return (
    <button
      className={["button", variantClass, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
