import { FileText, Sparkles, Clock, ListChecks } from "lucide-react";

const ChatPlaceHolder = () => {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Summaries",
      description:
        "Get concise, actionable summaries from lengthy meeting notes",
    },
    {
      icon: ListChecks,
      title: "Action Items",
      description: "Automatically extract tasks and action items with owners",
    },
    {
      icon: Clock,
      title: "Key Decisions",
      description: "Highlight important decisions and deadlines",
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-300/50">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <h2 className="mb-2 text-xl sm:text-2xl font-semibold">
          Welcome to MeetRecap
        </h2>
        <p className="mb-6 sm:mb-8 text-sm sm:text-base">
          Transform your meeting notes into clear, actionable summaries. Just
          paste your notes below to get started.
        </p>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-blue-300/80 p-4 text-left transition-colors "
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-300/50">
                <feature.icon className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="mb-1 font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatPlaceHolder;
