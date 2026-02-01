"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name is too long"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .regex(/^[a-z0-9]/, "Slug must start with a letter or number")
    .regex(/[a-z0-9]$/, "Slug must end with a letter or number"),
  logo: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Validate it's a proper base64 data URL
      return val.startsWith("data:image/");
    }, "Invalid image format"),
});

export default function CreateOrganizationPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    reValidateMode: "onChange",
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  });

  const { isDirty, isValid, isSubmitting } = form.formState;

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user) {
          router.push("/signin");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/signin");
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue("name", value, { shouldValidate: true, shouldDirty: true });
    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setValue("slug", generatedSlug, { shouldValidate: true });
  };

  // Handle logo upload with better validation and base64 conversion
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB for base64 to avoid huge strings)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Validate file type more strictly
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Create preview and convert to base64
    const reader = new FileReader();

    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.");
    };

    reader.onloadend = () => {
      const base64String = reader.result as string;

      // Validate base64 size (shouldn't exceed ~2.7MB after encoding)
      if (base64String.length > 2.7 * 1024 * 1024) {
        toast.error("Encoded image is too large. Please use a smaller file.");
        return;
      }

      setLogoPreview(base64String);
      form.setValue("logo", base64String, { shouldDirty: true, shouldValidate: true });
      toast.success("Logo uploaded successfully");
    };

    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue("logo", "", { shouldDirty: true });
    // Reset file input
    const fileInput = document.getElementById("logo-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      // Double-check authentication before submitting
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        toast.error("Your session has expired. Please sign in again.");
        router.push("/signin");
        return;
      }

      // Create organization with better-auth
      const { data: orgData, error: orgError } = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
        logo: data.logo || undefined,
      });

      if (orgError) {
        // Handle specific error cases
        if (orgError.message?.includes("slug")) {
          form.setError("slug", {
            message: "This slug is already taken. Please choose another.",
          });
          toast.error("Organization slug is already taken");
        } else {
          toast.error(orgError.message || "Failed to create organization");
        }
        return;
      }

      if (!orgData?.id) {
        toast.error("Organization created but no ID returned");
        return;
      }

      // Set the newly created organization as active
      const { error: setActiveError } = await authClient.organization.setActive({
        organizationId: orgData.id,
      });

      if (setActiveError) {
        console.error("Failed to set active organization:", setActiveError);
        toast.warning(
          "Organization created but failed to set as active. Please select it manually.",
        );
        router.push("/");
        return;
      }

      toast.success("Organization created successfully!");
      router.push("/");
      router.refresh(); // Refresh to update session with active organization
    } catch (error) {
      console.error("Unexpected error during organization creation:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create organization</CardTitle>
      </CardHeader>
      <CardContent>
        {isCheckingAuth ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <Text as="small" className="ml-2">
              Verifying authentication...
            </Text>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Text as="small">Redirecting to sign in...</Text>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {/* Logo Upload Section */}
              <Field>
                <FieldLabel>Organization logo</FieldLabel>
                <div className="flex items-start gap-4">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50 transition-colors hover:border-gray-400">
                    {logoPreview ? (
                      <>
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-full w-full rounded-lg object-cover"
                          width={96}
                          height={96}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label="Remove logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                        disabled={isSubmitting}
                      >
                        {logoPreview ? "Change logo" : "Upload logo"}
                      </Button>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isSubmitting}
                    />
                    <FieldDescription className="mt-2">
                      Recommended: Square (1:1 ratio), PNG, JPEG, or WebP. Max 2MB.
                    </FieldDescription>
                  </div>
                </div>
              </Field>

              {/* Name Field */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="org-name">Organization name *</FieldLabel>
                    <Input
                      {...field}
                      id="org-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter organization name"
                      autoComplete="off"
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <FieldDescription>
                      This will be the display name for your organization
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Slug Field */}
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="org-slug">Organization slug *</FieldLabel>
                    <Input
                      {...field}
                      id="org-slug"
                      aria-invalid={fieldState.invalid}
                      placeholder="my-organization"
                      autoComplete="off"
                      disabled={isSubmitting}
                    />
                    <FieldDescription>
                      Used in URLs. Auto-generated from name, but you can customize it.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Submit Button */}
              <Field>
                <Button
                  type="submit"
                  disabled={!isDirty || !isValid || isSubmitting}
                  className="w-full"
                >
                  Create organization
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
