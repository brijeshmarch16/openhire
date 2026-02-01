import { Plus } from "lucide-react";
import Link from "next/link";
import { InterviewCard } from "@/components/dashboard/interviews/list/interview-card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

const mockInterviews = [
  {
    id: "1",
    name: "Frontend Developer",
    interviewerImage: "/interviewers/bob.png",
    responseCount: 5,
    url: "frontend-dev",
    readableSlug: "frontend-developer",
  },
  {
    id: "2",
    name: "Backend Engineer",
    interviewerImage: "/interviewers/bob.png",
    responseCount: 3,
    url: "backend-eng",
    readableSlug: "backend-engineer",
  },
  {
    id: "3",
    name: "Product Manager",
    interviewerImage: "/interviewers/lisa.png",
    responseCount: 8,
    url: "pm-role",
    readableSlug: "product-manager",
  },
  {
    id: "4",
    name: "UX Designer",
    interviewerImage: "/interviewers/lisa.png",
    responseCount: 2,
    url: "ux-design",
    readableSlug: "ux-designer",
  },
];

export default function Home() {
  return (
    <div>
      <div className="flex justify-between">
        <Text as="h1">Interviews</Text>

        <Button asChild>
          <Link href="/interviews/create" className="flex items-center">
            <Plus className="mr-2 size-4" />
            Create Interview
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockInterviews.map((interview) => (
          <InterviewCard
            key={interview.id}
            id={interview.id}
            name={interview.name}
            interviewerImage={interview.interviewerImage}
            responseCount={interview.responseCount}
            url={interview.url}
            readableSlug={interview.readableSlug}
          />
        ))}
      </div>
    </div>
  );
}
