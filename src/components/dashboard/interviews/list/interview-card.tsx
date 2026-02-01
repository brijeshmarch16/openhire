"use client";

import { ArrowUpRight, Copy, CopyCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

interface InterviewCardProps {
  id: string;
  name: string;
  interviewerImage: string;
  responseCount: number;
  url: string;
  readableSlug?: string;
}

export function InterviewCard(props: InterviewCardProps) {
  const { id, name, interviewerImage, responseCount, url } = props;

  const [copied, setCopied] = useState(false);

  const router = useRouter();

  const copyLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}/take/${url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast.success("Interview link copied to clipboard!");
  };

  const openInterview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}/take/${url}`;
    window.open(fullUrl, "_blank");
  };

  const openInterviewDetails = () => {
    router.push(`/interviews/${id}`);
  };

  return (
    <Card className="cursor-pointer gap-0 overflow-hidden p-0" onClick={openInterviewDetails}>
      <div className="relative flex h-50 flex-col bg-primary">
        {/* Action buttons at top right */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button variant="secondary" size="xs" onClick={openInterview} title="Open interview">
            <ArrowUpRight />
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={copyLink}
            title={copied ? "Copied!" : "Copy link"}
          >
            {copied ? <CopyCheck /> : <Copy />}
          </Button>
        </div>

        {/* Centered interview name */}
        <div className="flex flex-1 items-center justify-center px-4">
          <Text as="h3" className="font-semibold text-primary-foreground">
            {name}
          </Text>
        </div>
      </div>

      {/* Footer with interviewer image and response count */}
      <div className="flex items-center justify-between p-3">
        {/* Interviewer Image */}
        <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
          <Image src={interviewerImage} alt={`${name} interviewer`} fill className="object-cover" />
        </div>

        {/* Response Count */}
        <div>
          <Text as="small" className="text-muted-foreground">
            Responses:{" "}
          </Text>
          <Text as="small" className="font-semibold">
            {responseCount}
          </Text>
        </div>
      </div>
    </Card>
  );
}
