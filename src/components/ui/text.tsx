import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const textVariants = cva("font-head", {
  variants: {
    as: {
      small: "font-sans text-sm",
      p: "font-sans text-base",
      li: "font-sans text-base",
      a: "font-sans text-base decoration-primary underline-offset-2 hover:underline",
      h1: "font-bold text-3xl",
      h2: "font-semibold text-3xl",
      h3: "font-medium text-2xl",
      h4: "font-normal text-xl",
      h5: "font-normal text-lg",
      h6: "font-normal text-base",
    },
  },
  defaultVariants: {
    as: "p",
  },
});

interface TextProps
  extends Omit<HTMLAttributes<HTMLElement>, "className">,
    VariantProps<typeof textVariants> {
  className?: string;
}

export const Text = (props: TextProps) => {
  const { className, as, ...otherProps } = props;
  const Tag: ElementType = as || "p";

  return <Tag className={cn(textVariants({ as }), className)} {...otherProps} />;
};
